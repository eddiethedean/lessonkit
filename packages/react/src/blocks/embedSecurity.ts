const BLOCKED_SANDBOX_TOKENS = new Set([
  "allow-top-navigation",
  "allow-top-navigation-by-user-activation",
  "allow-modals",
  "allow-downloads",
  "allow-popups-to-escape-sandbox",
]);

/**
 * Sandbox tokens authors may opt into via the Embed `allow` prop.
 * `allow-popups` lets embedded content open new browsing contexts; keep
 * `allow-popups-to-escape-sandbox` blocked. In production, Embed strips
 * `allow-popups` by default unless `config.embed.restrictPopupsInProduction`
 * is set to `false`.
 */
const ALLOWED_SANDBOX_TOKENS = new Set([
  "allow-forms",
  "allow-popups",
  "allow-presentation",
]);

const DEFAULT_SANDBOX = "allow-scripts";

export type MediaSrcOptions = {
  /** Hostnames allowed to bypass the production private-network blocklist. */
  allowedHosts?: readonly string[];
  /**
   * Docs/preview only (`preview.allowConsoleTelemetry`). Allows same-origin media
   * URLs to bypass production scheme and host blocklists.
   */
  trustSameOriginMedia?: boolean;
};

export type MediaConfig = {
  embed?: { allowedHosts?: readonly string[] };
  preview?: { allowConsoleTelemetry?: boolean };
};

export function buildMediaOptions(config: MediaConfig): MediaSrcOptions {
  return {
    allowedHosts: config.embed?.allowedHosts,
    trustSameOriginMedia: config.preview?.allowConsoleTelemetry === true,
  };
}

function isProductionEmbedBuild(): boolean {
  try {
    if ((import.meta as { env?: { PROD?: boolean } }).env?.PROD === true) return true;
  } catch {
    // ignore
  }
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "production";
}

function allowedEmbedSchemes(): Set<string> {
  return isProductionEmbedBuild() ? new Set(["https:"]) : new Set(["https:", "http:"]);
}

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
}

function expandIpv4Literal(hostname: string): string | null {
  if (/^\d+$/.test(hostname)) {
    const value = Number(hostname);
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) return null;
    return `${(value >>> 24) & 255}.${(value >>> 16) & 255}.${(value >>> 8) & 255}.${value & 255}`;
  }
  if (!/^\d+(?:\.\d+){1,3}$/.test(hostname)) return null;
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  let value = 0;
  for (const part of parts) {
    value = (value << 8) | part;
  }
  value <<= (4 - parts.length) * 8;
  return `${(value >>> 24) & 255}.${(value >>> 16) & 255}.${(value >>> 8) & 255}.${value & 255}`;
}

function canonicalHostnameForBlocklist(hostname: string): string {
  const normalized = normalizeHostname(hostname);
  return expandIpv4Literal(normalized) ?? normalized;
}

function isIpv4MappedAddress(hostname: string): string | null {
  const match = hostname.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return match?.[1] ?? null;
}

function isLoopbackHost(hostname: string): boolean {
  const ipv4Mapped = isIpv4MappedAddress(hostname);
  if (ipv4Mapped) return isLoopbackHost(ipv4Mapped);
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  );
}

function isIpv6UniqueLocalHost(hostname: string): boolean {
  return /^f[cd][0-9a-f]{0,2}:/i.test(hostname);
}

function isLinkLocalOrMetadataHost(hostname: string): boolean {
  if (hostname === "169.254.169.254") return true;
  if (/^169\.254\./.test(hostname)) return true;
  if (/^fe80:/i.test(hostname)) return true;
  return false;
}

function isRfc1918Host(hostname: string): boolean {
  const ipv4Mapped = isIpv4MappedAddress(hostname);
  if (ipv4Mapped) return isRfc1918Host(ipv4Mapped);
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  const parts = hostname.split(".").map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) return true;
  return false;
}

/** Returns true for loopback, RFC1918, link-local, and cloud metadata hostnames. */
export function isBlockedHost(hostname: string, allowedHosts?: readonly string[]): boolean {
  const normalized = normalizeHostname(hostname);
  const canonical = canonicalHostnameForBlocklist(hostname);
  if (
    allowedHosts?.some((host) => {
      const allowedNormalized = normalizeHostname(host);
      return (
        canonicalHostnameForBlocklist(host) === canonical || allowedNormalized === normalized
      );
    })
  ) {
    return false;
  }
  if (!isProductionEmbedBuild()) return false;
  return (
    isLoopbackHost(canonical) ||
    isLinkLocalOrMetadataHost(canonical) ||
    isRfc1918Host(canonical) ||
    isIpv6UniqueLocalHost(normalized)
  );
}

function resolveAllowedUrl(
  src: string,
  options?: MediaSrcOptions,
): string | null {
  const trimmed = src.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("data:image/")) {
    return trimmed;
  }
  try {
    const base =
      typeof window !== "undefined" ? window.location.href : "https://example.com/";
    const url = new URL(trimmed, base);
    if (
      options?.trustSameOriginMedia &&
      typeof window !== "undefined" &&
      url.origin === window.location.origin &&
      url.protocol !== "javascript:" &&
      url.protocol !== "data:"
    ) {
      url.username = "";
      url.password = "";
      return url.href;
    }
    if (!allowedEmbedSchemes().has(url.protocol)) {
      const sameOriginHttp =
        url.protocol === "http:" &&
        typeof window !== "undefined" &&
        url.origin === window.location.origin;
      if (!sameOriginHttp) return null;
    }
    if (isBlockedHost(url.hostname, options?.allowedHosts)) {
      const sameOriginBlockedHost =
        typeof window !== "undefined" && url.origin === window.location.origin;
      if (!sameOriginBlockedHost) return null;
    }
    if (typeof window !== "undefined") {
      const pageOrigin = window.location.origin;
      const isAbsolute = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) || trimmed.startsWith("//");
      if (!isAbsolute && url.origin !== pageOrigin) return null;
      if (trimmed.startsWith("//") && url.origin !== pageOrigin) return null;
    }
    url.username = "";
    url.password = "";
    return url.href;
  } catch {
    return null;
  }
}

export function resolveEmbedSrc(src: string, options?: MediaSrcOptions): string | null {
  return resolveAllowedUrl(src, options);
}

/** Sanitize image, video, poster, and caption URLs with the same scheme/host policy as embeds. */
export function resolveMediaSrc(src: string | undefined, options?: MediaSrcOptions): string | null {
  if (src === undefined) return null;
  return resolveAllowedUrl(src, options);
}

export type EmbedSandboxOptions = {
  /** Strip `allow-popups` in production builds (default true). */
  restrictPopupsInProduction?: boolean;
};

export function buildEmbedSandbox(allow?: string, options?: EmbedSandboxOptions): string {
  const tokens = new Set<string>([DEFAULT_SANDBOX]);
  if (allow) {
    for (const raw of allow.split(/\s+/)) {
      const token = raw.trim();
      if (!token || BLOCKED_SANDBOX_TOKENS.has(token)) continue;
      if (ALLOWED_SANDBOX_TOKENS.has(token)) tokens.add(token);
    }
  }
  if (options?.restrictPopupsInProduction !== false && isProductionEmbedBuild()) {
    tokens.delete("allow-popups");
  }
  return [...tokens].join(" ");
}

export function telemetryEmbedSrc(src: string): string {
  try {
    const url = new URL(src);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return `${url.origin}${url.pathname}`;
  } catch {
    return src;
  }
}

export function resolveEmbedAspectRatio(aspectRatio?: string): string | undefined {
  if (!aspectRatio) return undefined;
  const trimmed = aspectRatio.trim();
  if (!/^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/.test(trimmed)) return undefined;
  const [numRaw, denRaw] = trimmed.split("/").map((part) => part.trim());
  const num = Number(numRaw);
  const den = Number(denRaw);
  if (!Number.isFinite(num) || !Number.isFinite(den) || num <= 0 || den <= 0) return undefined;
  return trimmed;
}

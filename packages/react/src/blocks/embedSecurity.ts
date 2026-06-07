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

export function resolveEmbedSrc(src: string): string | null {
  const trimmed = src.trim();
  if (!trimmed) return null;
  try {
    const base =
      typeof window !== "undefined" ? window.location.href : "https://example.com/";
    const url = new URL(trimmed, base);
    if (!allowedEmbedSchemes().has(url.protocol)) return null;
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

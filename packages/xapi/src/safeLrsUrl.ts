export type AssertSafeLrsUrlOptions = {
  /** Allow loopback, RFC1918, link-local, and metadata IPs (default false). */
  allowPrivateHosts?: boolean;
};

function isProductionRuntime(): boolean {
  try {
    if ((import.meta as { env?: { PROD?: boolean } }).env?.PROD === true) return true;
  } catch {
    // no import.meta
  }
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "production";
}

function parseHostname(url: URL): string {
  return url.hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
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
    hostname === "::1" ||
    hostname === "0.0.0.0"
  );
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

function isPrivateOrMetadataHost(hostname: string): boolean {
  return isLoopbackHost(hostname) || isLinkLocalOrMetadataHost(hostname) || isRfc1918Host(hostname);
}

function containsPathTraversal(path: string): boolean {
  if (path.includes("..")) return true;
  let decoded = path;
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(decoded.replace(/\+/g, " "));
      if (next.includes("..")) return true;
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return false;
}

/** Validate an LRS or analytics proxy URL before browser fetch transport use. */
export function assertSafeLrsUrl(url: string, opts?: AssertSafeLrsUrlOptions): void {
  if (url.startsWith("//")) {
    throw new Error(`Unsafe LRS URL: protocol-relative URLs are not allowed "${url}"`);
  }

  if (url.startsWith("/")) {
    if (containsPathTraversal(url)) {
      throw new Error(`Unsafe LRS URL: path traversal in "${url}"`);
    }
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Unsafe LRS URL: invalid URL "${url}"`);
  }

  if (containsPathTraversal(parsed.pathname)) {
    throw new Error(`Unsafe LRS URL: path traversal in "${url}"`);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Unsafe LRS URL: unsupported scheme "${parsed.protocol}"`);
  }

  if (isProductionRuntime() && parsed.protocol !== "https:") {
    throw new Error("Unsafe LRS URL: HTTPS is required in production builds");
  }

  const hostname = parseHostname(parsed);
  if (!opts?.allowPrivateHosts && isPrivateOrMetadataHost(hostname)) {
    throw new Error(`Unsafe LRS URL: private or metadata host "${hostname}" is not allowed`);
  }
}

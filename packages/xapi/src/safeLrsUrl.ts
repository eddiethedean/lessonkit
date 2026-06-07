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

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
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
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  const parts = hostname.split(".").map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) return true;
  return false;
}

function isPrivateOrMetadataHost(hostname: string): boolean {
  return isLoopbackHost(hostname) || isLinkLocalOrMetadataHost(hostname) || isRfc1918Host(hostname);
}

/** Validate an LRS or analytics proxy URL before browser fetch transport use. */
export function assertSafeLrsUrl(url: string, opts?: AssertSafeLrsUrlOptions): void {
  if (url.startsWith("/")) {
    if (url.includes("..")) {
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

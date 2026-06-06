const ALLOWED_EMBED_SCHEMES = new Set(["https:", "http:"]);

const ALLOWED_SANDBOX_TOKENS = new Set([
  "allow-forms",
  "allow-popups",
  "allow-popups-to-escape-sandbox",
  "allow-presentation",
]);

const BLOCKED_SANDBOX_TOKENS = new Set([
  "allow-top-navigation",
  "allow-top-navigation-by-user-activation",
  "allow-modals",
  "allow-downloads",
]);

const DEFAULT_SANDBOX = "allow-scripts";

export function resolveEmbedSrc(src: string): string | null {
  const trimmed = src.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed, typeof window !== "undefined" ? window.location.href : "https://example.com");
    if (!ALLOWED_EMBED_SCHEMES.has(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function buildEmbedSandbox(allow?: string): string {
  const tokens = new Set<string>([DEFAULT_SANDBOX]);
  if (allow) {
    for (const raw of allow.split(/\s+/)) {
      const token = raw.trim();
      if (!token || BLOCKED_SANDBOX_TOKENS.has(token)) continue;
      if (ALLOWED_SANDBOX_TOKENS.has(token)) tokens.add(token);
    }
  }
  return [...tokens].join(" ");
}

export function telemetryEmbedSrc(src: string): string {
  try {
    const url = new URL(src);
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return src;
  }
}

export function resolveEmbedAspectRatio(aspectRatio?: string): string | undefined {
  if (!aspectRatio) return undefined;
  return /^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/.test(aspectRatio.trim()) ? aspectRatio.trim() : undefined;
}

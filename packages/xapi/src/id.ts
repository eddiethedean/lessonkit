const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function randomIdFallback(): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    g.crypto.getRandomValues(bytes);
    return formatUuid(bytes);
  }
  throw new Error(
    "[lessonkit] cryptoRandomId requires crypto.randomUUID or crypto.getRandomValues",
  );
}

function formatUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function hashSeedToUuid(seed: string): string {
  const bytes = new Uint8Array(16);
  let h0 = 2166136261;
  let h1 = 2166136261 ^ 0x9e3779b9;
  let h2 = 2166136261 ^ 0x85ebca6b;
  let h3 = 2166136261 ^ 0xc2b2ae35;
  for (let i = 0; i < seed.length; i += 1) {
    const c = seed.charCodeAt(i);
    h0 = Math.imul(h0 ^ c, 16777619);
    h1 = Math.imul(h1 ^ (c + 1), 16777619);
    h2 = Math.imul(h2 ^ (c + 2), 16777619);
    h3 = Math.imul(h3 ^ (c + 3), 16777619);
  }
  bytes[0] = (h0 >>> 24) & 0xff;
  bytes[1] = (h0 >>> 16) & 0xff;
  bytes[2] = (h0 >>> 8) & 0xff;
  bytes[3] = h0 & 0xff;
  bytes[4] = (h1 >>> 24) & 0xff;
  bytes[5] = (h1 >>> 16) & 0xff;
  bytes[6] = ((h1 >>> 8) & 0x0f) | 0x50;
  bytes[7] = h1 & 0xff;
  bytes[8] = ((h2 >>> 24) & 0x3f) | 0x80;
  bytes[9] = (h2 >>> 16) & 0xff;
  bytes[10] = (h2 >>> 8) & 0xff;
  bytes[11] = h2 & 0xff;
  bytes[12] = (h3 >>> 24) & 0xff;
  bytes[13] = (h3 >>> 16) & 0xff;
  bytes[14] = (h3 >>> 8) & 0xff;
  bytes[15] = h3 & 0xff;
  return formatUuid(bytes);
}

export function cryptoRandomId(): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return randomIdFallback();
}

/** Stable xAPI statement id from telemetry event identity (idempotent across retries). */
export function deriveStatementId(
  event: { id?: string; name: string; courseId: string; lessonId?: string; sessionId?: string; timestamp: string },
  objectId: string,
  verb: string,
): string {
  const eventId = event.id?.trim();
  if (eventId && UUID_RE.test(eventId)) return eventId;
  const seed = [
    event.name,
    event.courseId,
    event.lessonId ?? "",
    event.sessionId ?? "",
    objectId,
    verb,
    event.timestamp,
  ].join("|");
  return hashSeedToUuid(seed);
}

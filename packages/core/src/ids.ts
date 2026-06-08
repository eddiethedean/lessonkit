function randomSessionIdFallback(): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    g.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `s-${hex}`;
  }
  throw new Error(
    "[lessonkit] createSessionId requires crypto.randomUUID or crypto.getRandomValues",
  );
}

export function createSessionId(): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto?.randomUUID) {
    return `s-${g.crypto.randomUUID().replace(/-/g, "")}`;
  }
  return randomSessionIdFallback();
}


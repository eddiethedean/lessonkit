/** True when running outside production (dev warnings enabled). */
export function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

export function warnDev(message: string, err: unknown): void {
  if (!isDevEnvironment()) return;
  console.warn(message, err instanceof Error ? err.message : err);
}

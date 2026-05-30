import { assertValidId, validateId } from "@lessonkit/core";

const warnedPaths = new Set<string>();

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

/** Normalize and validate a component id (trimmed per identity v1). Throws when invalid. */
export function normalizeComponentId(id: unknown, path: string): string {
  return assertValidId(id, path);
}

/** Warn once per path in development when an id fails validateId. */
export function warnInvalidComponentId(id: unknown, path: string): void {
  if (!isDevEnvironment()) return;
  const key = `${path}:${String(id)}`;
  if (warnedPaths.has(key)) return;
  const result = validateId(id, path);
  if (result.ok) return;
  warnedPaths.add(key);
  const detail = result.issues.map((i) => `${i.path}: ${i.message}`).join("; ");
  console.warn(`[lessonkit] invalid ${path} — ${detail}`);
}

export { isDevEnvironment };

import { validateId } from "@lessonkit/core";

const warnedPaths = new Set<string>();

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
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

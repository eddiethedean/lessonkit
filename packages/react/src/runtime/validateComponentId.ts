import { assertValidId } from "@lessonkit/core";

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

/** Normalize and validate a component id (trimmed per identity v1). Throws when invalid. */
export function normalizeComponentId(id: unknown, path: string): string {
  return assertValidId(id, path);
}

export { isDevEnvironment };

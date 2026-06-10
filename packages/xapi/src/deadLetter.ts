import type { XAPIStatement } from "./types";

const STORAGE_KEY = "lk-xapi-dead-letter";
const MAX_DEAD_LETTER = 200;

export type PersistDeadLetterOptions = {
  onTruncated?: (droppedCount: number) => void;
  onPersistError?: (err: unknown, ctx: { statement: XAPIStatement }) => void;
};

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

function reportPersistError(
  err: unknown,
  statement: XAPIStatement,
  opts?: PersistDeadLetterOptions,
): void {
  opts?.onPersistError?.(err, { statement });
  if (!opts?.onPersistError && isDevEnvironment()) {
    console.warn(
      "[lessonkit] xAPI dead-letter persist failed:",
      err instanceof Error ? err.message : err,
    );
  }
}

function readStorage(): Storage | null {
  try {
    const storage = (globalThis as typeof globalThis & { sessionStorage?: Storage }).sessionStorage;
    return storage ?? null;
  } catch {
    return null;
  }
}

export function loadDeadLetterStatements(): XAPIStatement[] {
  const storage = readStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is XAPIStatement =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as XAPIStatement).id === "string",
    );
  } catch {
    return [];
  }
}

export function persistDeadLetterStatement(
  statement: XAPIStatement,
  opts?: PersistDeadLetterOptions,
): void {
  const storage = readStorage();
  if (!storage) {
    reportPersistError(new Error("sessionStorage is unavailable"), statement, opts);
    return;
  }
  try {
    const existing = loadDeadLetterStatements();
    if (existing.some((s) => s.id === statement.id)) return;
    const combined = [...existing, statement];
    if (combined.length > MAX_DEAD_LETTER) {
      opts?.onTruncated?.(combined.length - MAX_DEAD_LETTER);
    }
    const next = combined.slice(-MAX_DEAD_LETTER);
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    reportPersistError(err, statement, opts);
  }
}

export function removeDeadLetterStatement(id: string): void {
  const storage = readStorage();
  if (!storage) return;
  try {
    const next = loadDeadLetterStatements().filter((s) => s.id !== id);
    if (next.length === 0) {
      storage.removeItem(STORAGE_KEY);
    } else {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore
  }
}

export function clearDeadLetterStorage(): void {
  readStorage()?.removeItem(STORAGE_KEY);
}

import type { XAPIStatement } from "./types";

const STORAGE_KEY = "lk-xapi-dead-letter";
const MAX_DEAD_LETTER = 200;

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

export function persistDeadLetterStatement(statement: XAPIStatement): void {
  const storage = readStorage();
  if (!storage) return;
  try {
    const existing = loadDeadLetterStatements();
    if (existing.some((s) => s.id === statement.id)) return;
    const next = [...existing, statement].slice(-MAX_DEAD_LETTER);
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // sessionStorage quota or private mode
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

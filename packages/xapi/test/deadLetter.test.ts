import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { XAPIStatement } from "../src";
import {
  clearDeadLetterStorage,
  loadDeadLetterStatements,
  persistDeadLetterStatement,
  removeDeadLetterStatement,
} from "../src/deadLetter";

function createMockSessionStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, value);
    },
  } as Storage;
}

const stmt: XAPIStatement = {
  id: "dead-letter-1",
  timestamp: "2026-01-01T00:00:00Z",
  verb: "http://adlnet.gov/expapi/verbs/completed",
  object: { id: "urn:example:activity" },
};

describe("xAPI dead-letter storage", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", createMockSessionStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty when sessionStorage is unavailable", () => {
    const onPersistError = vi.fn();
    vi.stubGlobal("sessionStorage", undefined);
    expect(loadDeadLetterStatements()).toEqual([]);
    persistDeadLetterStatement(stmt, { onPersistError });
    expect(loadDeadLetterStatements()).toEqual([]);
    expect(onPersistError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "sessionStorage is unavailable" }),
      { statement: stmt },
    );
  });

  it("invokes onPersistError when sessionStorage.setItem throws", () => {
    const onPersistError = vi.fn();
    vi.spyOn(sessionStorage, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    persistDeadLetterStatement(stmt, { onPersistError });
    expect(onPersistError).toHaveBeenCalledWith(expect.any(DOMException), { statement: stmt });
    expect(loadDeadLetterStatements()).toEqual([]);
  });

  it("warns in dev when persist fails without onPersistError", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubEnv("NODE_ENV", "development");
    vi.spyOn(sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    persistDeadLetterStatement(stmt);
    expect(warn).toHaveBeenCalledWith(
      "[lessonkit] xAPI dead-letter persist failed:",
      "blocked",
    );
    warn.mockRestore();
    vi.unstubAllEnvs();
  });

  it("returns empty for invalid JSON", () => {
    sessionStorage.setItem("lk-xapi-dead-letter", "{not-json");
    expect(loadDeadLetterStatements()).toEqual([]);
  });

  it("returns empty for non-array payloads", () => {
    sessionStorage.setItem("lk-xapi-dead-letter", JSON.stringify({ id: "dead-letter-1" }));
    expect(loadDeadLetterStatements()).toEqual([]);
  });

  it("filters malformed statement entries", () => {
    sessionStorage.setItem(
      "lk-xapi-dead-letter",
      JSON.stringify([stmt, { verb: "missing-id" }]),
    );
    expect(loadDeadLetterStatements().map((s) => s.id)).toEqual(["dead-letter-1"]);
  });

  it("dedupes persisted statements by id", () => {
    persistDeadLetterStatement(stmt);
    persistDeadLetterStatement(stmt);
    expect(loadDeadLetterStatements()).toHaveLength(1);
  });

  it("clears storage when the last dead-letter entry is removed", () => {
    persistDeadLetterStatement(stmt);
    removeDeadLetterStatement(stmt.id);
    expect(sessionStorage.getItem("lk-xapi-dead-letter")).toBeNull();
  });

  it("supports explicit clear", () => {
    persistDeadLetterStatement(stmt);
    clearDeadLetterStorage();
    expect(loadDeadLetterStatements()).toEqual([]);
  });
});

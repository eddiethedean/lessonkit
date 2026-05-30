import { describe, expect, it } from "vitest";
import { createNoopStorage } from "../src/ports";
import {
  getTabSessionId,
  hasCourseStarted,
  markCourseStarted,
  migrateCourseStartedMark,
  resolveSessionId,
  SESSION_STORAGE_KEY,
} from "../src/session";

describe("session", () => {
  it("resolveSessionId uses provided id", () => {
    const storage = createNoopStorage();
    expect(resolveSessionId(storage, "fixed")).toBe("fixed");
  });

  it("resolveSessionId reuses stored tab session id", () => {
    const store: Record<string, string> = { [SESSION_STORAGE_KEY]: "tab-1" };
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    };
    expect(resolveSessionId(storage, undefined)).toBe("tab-1");
  });

  it("resolveSessionId creates and persists a new id", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    };
    const id = resolveSessionId(storage, undefined);
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(store[SESSION_STORAGE_KEY]).toBe(id);
  });

  it("getTabSessionId reads session key", () => {
    const storage = {
      getItem: (k: string) => (k === SESSION_STORAGE_KEY ? "s1" : null),
      setItem: () => {},
    };
    expect(getTabSessionId(storage)).toBe("s1");
  });

  it("course started marks are scoped to courseId", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };

    expect(hasCourseStarted(storage, "s", "c1")).toBe(false);
    markCourseStarted(storage, "s", "c1");
    expect(hasCourseStarted(storage, "s", "c1")).toBe(true);
    expect(hasCourseStarted(storage, "s", "c2")).toBe(false);
    expect(hasCourseStarted(storage, "s")).toBe(false);
    markCourseStarted(storage, "s", undefined);
  });

  it("migrateCourseStartedMark moves dedupe between session ids", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };

    markCourseStarted(storage, "old", "c1");
    migrateCourseStartedMark(storage, "old", "new", "c1");
    expect(hasCourseStarted(storage, "new", "c1")).toBe(true);
    expect(hasCourseStarted(storage, "old", "c1")).toBe(false);
    migrateCourseStartedMark(storage, "new", "new", "c1");
    migrateCourseStartedMark(storage, "a", "b", undefined);
  });
});

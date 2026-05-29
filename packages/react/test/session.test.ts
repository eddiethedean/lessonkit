import { describe, expect, it } from "vitest";
import { createNoopStorage } from "../src/runtime/ports";
import {
  hasCourseStarted,
  markCourseStarted,
  migrateCourseStartedMark,
  resolveSessionId,
} from "../src/runtime/session";

describe("@lessonkit/react runtime/session", () => {
  it("resolveSessionId returns provided id without touching storage", () => {
    const storage = createNoopStorage();
    expect(resolveSessionId(storage, "provided")).toBe("provided");
  });

  it("resolveSessionId persists generated id to storage", () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    };

    const id1 = resolveSessionId(storage);
    const id2 = resolveSessionId(storage);
    expect(id1).toBe(id2);
    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(0);
  });

  it("course started markers are namespaced by session+course", () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    };

    const sessionA = "session-a";
    const sessionB = "session-b";
    const course = "course-1";

    expect(hasCourseStarted(storage, sessionA, course)).toBe(false);
    markCourseStarted(storage, sessionA, course);
    expect(hasCourseStarted(storage, sessionA, course)).toBe(true);

    // different session should not be marked
    expect(hasCourseStarted(storage, sessionB, course)).toBe(false);
  });

  it("migrateCourseStartedMark copies dedup state to a new session id", () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
    };

    markCourseStarted(storage, "old-session", "course-1");
    migrateCourseStartedMark(storage, "old-session", "new-session", "course-1");
    expect(hasCourseStarted(storage, "new-session", "course-1")).toBe(true);
    expect(hasCourseStarted(storage, "old-session", "course-1")).toBe(false);
  });
});


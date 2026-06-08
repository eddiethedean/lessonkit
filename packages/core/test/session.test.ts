import { describe, expect, it, vi } from "vitest";
import { createNoopStorage } from "../src/ports";
import {
  getTabSessionId,
  hasCourseStarted,
  hasCourseStartedEmittedToTracking,
  markCourseStarted,
  markCourseStartedEmittedToTracking,
  hasCourseStartedPipelineDelivered,
  markCourseStartedPipelineDelivered,
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
        return true;
      },
    };
    expect(resolveSessionId(storage, undefined)).toBe("tab-1");
  });

  it("resolveSessionId reuses volatile id when persistence fails", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    const storage = {
      getItem: () => null,
      setItem: () => false,
    };

    try {
      const id1 = resolveSessionId(storage, undefined);
      const id2 = resolveSessionId(storage, undefined);
      expect(id1).toBe(id2);
      expect(warn).toHaveBeenCalledWith(
        "[lessonkit] session id could not be persisted; using in-memory id for this storage.",
      );
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("resolveSessionId creates and persists a new id", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
      },
    };
    const id = resolveSessionId(storage, undefined);
    expect(id.length).toBeGreaterThan(0);
    expect(store[SESSION_STORAGE_KEY]).toBe(id);
  });

  it("getTabSessionId reads session key", () => {
    const storage = {
      getItem: (k: string) => (k === SESSION_STORAGE_KEY ? "s1" : null),
      setItem: () => true,
    };
    expect(getTabSessionId(storage)).toBe("s1");
  });

  it("resolveSessionId rejects invalid provided ids and falls back to stored id", () => {
    const store: Record<string, string> = { [SESSION_STORAGE_KEY]: "tab-valid" };
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
      },
    };
    expect(resolveSessionId(storage, "bad:id")).toBe("tab-valid");
  });

  it("resolveSessionId regenerates invalid stored tab session id", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    const store: Record<string, string> = { [SESSION_STORAGE_KEY]: "bad:id" };
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };

    try {
      const id = resolveSessionId(storage, undefined);
      expect(id).toMatch(/^s-/);
      expect(store[SESSION_STORAGE_KEY]).toBe(id);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("Invalid stored sessionId"),
      );
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("course started marks use encoded session segments for invalid stored ids", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };

    markCourseStarted(storage, "bad:id", "c1");
    expect(hasCourseStarted(storage, "bad:id", "c1")).toBe(true);
    expect(store["lessonkit:course_started:bad%3Aid:c1"]).toBe("1");
  });

  it("course started marks are scoped to courseId", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
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
        return true;
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
    expect(hasCourseStarted(storage, "new", "c1")).toBe(true);
    const keysBefore = Object.keys(store).length;
    migrateCourseStartedMark(storage, "a", "b", undefined);
    expect(Object.keys(store).length).toBe(keysBefore);
  });

  it("migrateCourseStartedMark retains source when destination write fails", () => {
    const store: Record<string, string> = {
      "lessonkit:course_started:old:c1": "1",
    };
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        if (k.includes(":new:")) return false;
        store[k] = v;
        return true;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };

    migrateCourseStartedMark(storage, "old", "new", "c1");
    expect(hasCourseStarted(storage, "old", "c1")).toBe(true);
    expect(hasCourseStarted(storage, "new", "c1")).toBe(false);
  });

  it("tracking emitted marks are scoped to courseId", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };

    expect(hasCourseStartedEmittedToTracking(storage, "s", "c1")).toBe(false);
    markCourseStartedEmittedToTracking(storage, "s", "c1");
    expect(hasCourseStartedEmittedToTracking(storage, "s", "c1")).toBe(true);
    expect(hasCourseStartedEmittedToTracking(storage, "s", "c2")).toBe(false);
    expect(hasCourseStartedEmittedToTracking(storage, "s")).toBe(false);
    markCourseStartedEmittedToTracking(storage, "s", undefined);
  });

  it("tracks pipeline delivery separately from session and tracking marks", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };

    expect(hasCourseStartedPipelineDelivered(storage, "s", "c1")).toBe(false);
    markCourseStartedPipelineDelivered(storage, "s", "c1");
    expect(hasCourseStartedPipelineDelivered(storage, "s", "c1")).toBe(true);
  });

  it("migrateCourseStartedMark moves tracking dedupe between session ids", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };

    markCourseStarted(storage, "old", "c1");
    markCourseStartedEmittedToTracking(storage, "old", "c1");
    markCourseStartedPipelineDelivered(storage, "old", "c1");
    migrateCourseStartedMark(storage, "old", "new", "c1");
    expect(hasCourseStarted(storage, "new", "c1")).toBe(true);
    expect(hasCourseStartedEmittedToTracking(storage, "new", "c1")).toBe(true);
    expect(hasCourseStartedPipelineDelivered(storage, "new", "c1")).toBe(true);
    expect(hasCourseStarted(storage, "old", "c1")).toBe(false);
    expect(hasCourseStartedEmittedToTracking(storage, "old", "c1")).toBe(false);
    expect(hasCourseStartedPipelineDelivered(storage, "old", "c1")).toBe(false);
  });
});

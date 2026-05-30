import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDefaultClock,
  createGlobalTimer,
  createNoopStorage,
  createSessionStoragePort,
  resetStoragePortForTests,
} from "../src/ports";

describe("ports", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("createDefaultClock returns stable shapes", () => {
    const clock = createDefaultClock();
    expect(typeof clock.nowMs()).toBe("number");
    expect(typeof clock.nowIso()).toBe("string");
  });

  it("createNoopStorage never persists", () => {
    const storage = createNoopStorage();
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBeNull();
  });

  it("createSessionStoragePort reads and writes when available", () => {
    const store: Record<string, string> = {};
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    });
    const storage = createSessionStoragePort();
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v");
    storage.removeItem?.("k");
    expect(storage.getItem("k")).toBeNull();
  });

  it("createSessionStoragePort caches sessionStorage reads in memory", () => {
    const store: Record<string, string> = { seeded: "from-session" };
    let getCalls = 0;
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => {
        getCalls += 1;
        return store[k] ?? null;
      },
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    });
    const storage = createSessionStoragePort();
    expect(storage.getItem("seeded")).toBe("from-session");
    expect(storage.getItem("seeded")).toBe("from-session");
    expect(getCalls).toBe(1);
  });

  it("createSessionStoragePort ignores storage errors but keeps in-memory dedupe", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("quota");
      },
    });
    const storage = createSessionStoragePort();
    expect(storage.getItem("k")).toBeNull();
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v");
    storage.removeItem?.("k");
    expect(storage.getItem("k")).toBeNull();
  });

  it("warns once in development when sessionStorage persistence fails", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("sessionStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("quota");
      },
    });
    const storage = createSessionStoragePort();
    storage.setItem("a", "1");
    storage.setItem("b", "2");
    storage.removeItem?.("a");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("sessionStorage is unavailable or failed");
  });

  it("createSessionStoragePort uses in-memory store when sessionStorage is missing", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", { value: undefined, configurable: true });
    const storage = createSessionStoragePort();
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v");
    storage.removeItem?.("k");
    expect(storage.getItem("k")).toBeNull();
    resetStoragePortForTests(storage);
    expect(storage.getItem("k")).toBeNull();
    if (original) Object.defineProperty(globalThis, "sessionStorage", original);
  });

  it("resetStoragePortForTests clears memory-backed ports", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("quota");
      },
    });
    const storage = createSessionStoragePort();
    storage.setItem("k", "v");
    resetStoragePortForTests(storage);
    expect(storage.getItem("k")).toBeNull();
  });

  it("createGlobalTimer schedules and clears intervals", () => {
    vi.useFakeTimers();
    try {
      const timer = createGlobalTimer();
      const fn = vi.fn();
      const id = timer.setInterval(fn, 10);
      vi.advanceTimersByTime(25);
      expect(fn).toHaveBeenCalled();
      timer.clearInterval(id);
    } finally {
      vi.useRealTimers();
    }
  });
});

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

  it("createNoopStorage persists in memory", () => {
    const storage = createNoopStorage();
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v");
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

  it("createSessionStoragePort invalidates cache on cross-tab storage events", () => {
    const store: Record<string, string> = { seeded: "v1" };
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    });
    const listeners = new Map<string, (event: StorageEvent) => void>();
    vi.stubGlobal("window", {
      addEventListener: (type: string, handler: (event: StorageEvent) => void) => {
        if (type === "storage") listeners.set("storage", handler);
      },
    });

    const storage = createSessionStoragePort();
    expect(storage.getItem("seeded")).toBe("v1");

    store.seeded = "v2";
    listeners.get("storage")?.({
      key: "seeded",
      newValue: "v2",
      storageArea: sessionStorage,
    } as StorageEvent);

    expect(storage.getItem("seeded")).toBe("v2");
  });

  it("createSessionStoragePort keeps in-memory values for generic keys when sessionStorage fails", () => {
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

  it("caches course_started marks in memory when sessionStorage setItem fails", () => {
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
    const key = "lessonkit:course_started:session-1:course-1";
    expect(storage.setItem(key, "1")).toBe(false);
    expect(storage.getItem(key)).toBe("1");
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

  it("createSessionStoragePort uses in-memory store when sessionStorage is null", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", { value: null, configurable: true });
    try {
      const storage = createSessionStoragePort();
      storage.setItem("k", "v");
      expect(storage.getItem("k")).toBe("v");
    } finally {
      if (original) Object.defineProperty(globalThis, "sessionStorage", original);
    }
  });

  it("createSessionStoragePort uses in-memory store when sessionStorage access throws", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get: () => {
        throw new Error("SecurityError");
      },
    });
    try {
      const storage = createSessionStoragePort();
      storage.setItem("k", "v");
      expect(storage.getItem("k")).toBe("v");
    } finally {
      if (original) Object.defineProperty(globalThis, "sessionStorage", original);
    }
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

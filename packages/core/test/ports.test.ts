import { describe, expect, it, vi } from "vitest";
import {
  createDefaultClock,
  createGlobalTimer,
  createNoopStorage,
  createSessionStoragePort,
} from "../src/ports";

describe("ports", () => {
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
    const storage = createSessionStoragePort();
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v");
    storage.removeItem?.("k");
    expect(storage.getItem("k")).toBeNull();
  });

  it("createSessionStoragePort ignores storage errors", () => {
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
    try {
      const storage = createSessionStoragePort();
      expect(storage.getItem("k")).toBeNull();
      storage.setItem("k", "v");
      storage.removeItem?.("k");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("createSessionStoragePort falls back when sessionStorage is missing", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    try {
      Object.defineProperty(globalThis, "sessionStorage", { value: undefined, configurable: true });
      const storage = createSessionStoragePort();
      storage.setItem("k", "v");
      expect(storage.getItem("k")).toBeNull();
    } finally {
      if (original) Object.defineProperty(globalThis, "sessionStorage", original);
    }
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

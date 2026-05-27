import { describe, expect, it, vi } from "vitest";
import { focusFirst, prefersReducedMotion } from "../src";

describe("@lessonkit/accessibility", () => {
  it("prefersReducedMotion returns false when matchMedia is missing", () => {
    const prev = (globalThis as any).window;
    (globalThis as any).window = {};
    expect(prefersReducedMotion()).toBe(false);
    (globalThis as any).window = prev;
  });

  it("prefersReducedMotion reflects matchMedia result", () => {
    const prev = (globalThis as any).window;
    (globalThis as any).window = {
      matchMedia: vi.fn(() => ({ matches: true })),
    };
    expect(prefersReducedMotion()).toBe(true);
    (globalThis as any).window = prev;
  });

  it("focusFirst returns false for null container", () => {
    expect(focusFirst(null)).toBe(false);
  });

  it("focusFirst focuses first matching element", () => {
    const focus = vi.fn();
    const container = {
      querySelector: <T,>(_sel: string) => ({ focus } as unknown as T),
    };
    expect(focusFirst(container)).toBe(true);
    expect(focus).toHaveBeenCalledTimes(1);
  });
});


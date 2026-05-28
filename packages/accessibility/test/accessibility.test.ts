import { afterEach, describe, expect, it, vi } from "vitest";
import { focusFirst, prefersReducedMotion, visuallyHiddenStyle } from "../src";

describe("@lessonkit/accessibility", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefersReducedMotion returns false when matchMedia is missing", () => {
    vi.stubGlobal("window", {});
    expect(prefersReducedMotion()).toBe(false);
  });

  it("prefersReducedMotion reflects matchMedia result", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });
    expect(prefersReducedMotion()).toBe(true);
  });

  it("focusFirst returns false for null container", () => {
    expect(focusFirst(null)).toBe(false);
  });

  it("visuallyHiddenStyle clips content for screen readers only", () => {
    expect(visuallyHiddenStyle.position).toBe("absolute");
    expect(visuallyHiddenStyle.overflow).toBe("hidden");
  });

  it("focusFirst focuses first matching element", () => {
    const focus = vi.fn();
    const container = {
      querySelector: <T,>(_sel: string) => ({ focus }) as unknown as T,
    };
    expect(focusFirst(container)).toBe(true);
    expect(focus).toHaveBeenCalledTimes(1);
  });
});

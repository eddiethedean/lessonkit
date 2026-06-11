// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCoarsePointer, usePickAndPlace } from "../src/interaction";

describe("usePickAndPlace", () => {
  it("toggles selection", () => {
    const { result } = renderHook(() => usePickAndPlace<string>());
    act(() => result.current.toggle("a"));
    expect(result.current.selected).toBe("a");
    act(() => result.current.toggle("a"));
    expect(result.current.selected).toBeNull();
  });
});

describe("useCoarsePointer", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("reads coarse pointer media query", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("coarse"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as typeof window.matchMedia;

    const { result } = renderHook(() => useCoarsePointer());
    expect(result.current).toBe(true);
  });
});

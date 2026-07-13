import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ThemeProvider system mode", () => {
  it("reacts to system color scheme changes", () => {
    let matches = true;
    const listeners: Array<() => void> = [];
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        get matches() {
          return matches;
        },
        media: query,
        addEventListener: (_: string, cb: () => void) => listeners.push(cb),
        removeEventListener: vi.fn(),
      })),
    );

    function Reader() {
      const { resolvedMode } = useTheme();
      return <span data-testid="mode">{resolvedMode}</span>;
    }

    render(
      <ThemeProvider mode="system">
        <Reader />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("mode").textContent).toBe("dark");
    matches = false;
    act(() => {
      listeners[0]?.();
    });
    expect(screen.getByTestId("mode").textContent).toBe("light");
    matches = true;
    act(() => {
      listeners[0]?.();
    });
    expect(screen.getByTestId("mode").textContent).toBe("dark");
  });
});

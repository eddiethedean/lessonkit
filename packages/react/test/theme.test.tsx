import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-lk-theme");
  for (const prop of Array.from(document.documentElement.style)) {
    if (prop.startsWith("--lk-")) {
      document.documentElement.style.removeProperty(prop);
    }
  }
});

function ThemeReader() {
  const { theme, resolvedMode } = useTheme();
  return (
    <span data-testid="reader">
      {resolvedMode}:{theme.colors.primary}
    </span>
  );
}

describe("ThemeProvider", () => {
  it("sets --lk-color-primary on documentElement", () => {
    render(
      <ThemeProvider mode="light">
        <ThemeReader />
      </ThemeProvider>,
    );
    expect(document.documentElement.style.getPropertyValue("--lk-color-primary").trim()).toBe(
      "#2563eb",
    );
  });

  it("applies theme override", () => {
    render(
      <ThemeProvider mode="light" theme={{ colors: { primary: "#abcdef" } }}>
        <ThemeReader />
      </ThemeProvider>,
    );
    expect(document.documentElement.style.getPropertyValue("--lk-color-primary").trim()).toBe(
      "#abcdef",
    );
  });

  it("getSystemMode returns light when matchMedia is unavailable", () => {
    const original = window.matchMedia;
    // @ts-expect-error test SSR-style environment
    window.matchMedia = undefined;
    render(
      <ThemeProvider mode="system">
        <ThemeReader />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("reader").textContent).toMatch(/^light:/);
    window.matchMedia = original;
  });

  it("useTheme returns merged theme", () => {
    render(
      <ThemeProvider mode="dark" preset="brand">
        <ThemeReader />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("reader").textContent).toMatch(/^dark:/);
    expect(screen.getByTestId("reader").textContent).toContain("#7c3aed");
  });

  it("preset=brand with mode=light keeps light background and brand primary", () => {
    render(
      <ThemeProvider mode="light" preset="brand">
        <ThemeReader />
      </ThemeProvider>,
    );
    expect(document.documentElement.style.getPropertyValue("--lk-color-background").trim()).toBe(
      "#f7f8ff",
    );
    expect(document.documentElement.style.getPropertyValue("--lk-color-primary").trim()).toBe(
      "#7c3aed",
    );
    expect(document.documentElement.style.getPropertyValue("--lk-color-extra-accent").trim()).toBe(
      "#22d3ee",
    );
  });

  it("preset=brand with mode=dark keeps dark background and brand primary", () => {
    render(
      <ThemeProvider mode="dark" preset="brand">
        <ThemeReader />
      </ThemeProvider>,
    );
    expect(document.documentElement.style.getPropertyValue("--lk-color-background").trim()).toBe(
      "#0b1020",
    );
    expect(document.documentElement.style.getPropertyValue("--lk-color-primary").trim()).toBe(
      "#7c3aed",
    );
  });

  it("preset=light merges named light preset onto mode base", () => {
    render(
      <ThemeProvider mode="light" preset="light">
        <ThemeReader />
      </ThemeProvider>,
    );
    expect(document.documentElement.style.getPropertyValue("--lk-color-background").trim()).toBe(
      "#f7f8ff",
    );
    expect(document.documentElement.style.getPropertyValue("--lk-color-extra-accent").trim()).toBe(
      "#22d3ee",
    );
  });

  it("preset=dark merges named dark preset onto mode base", () => {
    render(
      <ThemeProvider mode="dark" preset="dark">
        <ThemeReader />
      </ThemeProvider>,
    );
    expect(document.documentElement.style.getPropertyValue("--lk-color-background").trim()).toBe(
      "#0b1020",
    );
  });

  it("mode=system follows matchMedia", () => {
    const listeners: Array<() => void> = [];
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("dark"),
        media: query,
        addEventListener: (_: string, cb: () => void) => listeners.push(cb),
        removeEventListener: () => {},
      })),
    );

    render(
      <ThemeProvider mode="system">
        <ThemeReader />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("reader").textContent).toMatch(/^dark:/);
    vi.unstubAllGlobals();
  });

  it("target=element scopes variables to host", () => {
    const { container, unmount } = render(
      <ThemeProvider target="element" mode="light" theme={{ colors: { primary: "#111111" } }}>
        <span data-testid="scoped" />
      </ThemeProvider>,
    );
    const host = container.querySelector("[data-lk-theme]") as HTMLElement;
    expect(host.style.getPropertyValue("--lk-color-primary").trim()).toBe("#111111");
    unmount();
    expect(document.documentElement.style.getPropertyValue("--lk-color-primary").trim()).toBe("");
  });

  it("nested element provider overrides primary in subtree", () => {
    function Nested() {
      return (
        <ThemeProvider target="element" mode="light" theme={{ colors: { primary: "#222222" } }}>
          <span data-testid="nested" style={{ color: "var(--lk-color-primary)" }}>
            nested
          </span>
        </ThemeProvider>
      );
    }

    const { container } = render(
      <ThemeProvider target="element" mode="light" theme={{ colors: { primary: "#111111" } }}>
        <Nested />
      </ThemeProvider>,
    );

    const hosts = container.querySelectorAll("[data-lk-theme]");
    expect(hosts.length).toBe(2);
    expect((hosts[1] as HTMLElement).style.getPropertyValue("--lk-color-primary").trim()).toBe(
      "#222222",
    );
  });

  it("throws when useTheme is outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThemeReader />)).toThrow(/ThemeProvider/);
    spy.mockRestore();
  });
});

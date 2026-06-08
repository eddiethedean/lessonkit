import type { ThemeMode } from "@lessonkit/react";

/** Match OS appearance so docs iframe embeds are readable in light mode. */
export function initialShowcaseThemeMode(): ThemeMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

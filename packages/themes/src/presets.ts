import { mergeThemes } from "./merge";
import type { LessonkitThemeV1, PartialLessonkitThemeV1 } from "./schema";

const sharedTypography = {
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSizeBase: "16px",
  lineHeightBase: "1.55",
  fontWeightNormal: "400",
  fontWeightStrong: "700",
} as const;

const sharedSpacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "18px",
  xl: "24px",
} as const;

const sharedRadius = {
  sm: "6px",
  md: "10px",
  lg: "16px",
} as const;

export const defaultTheme: LessonkitThemeV1 = {
  name: "default",
  colors: {
    background: "#ffffff",
    foreground: "#111827",
    primary: "#2563eb",
    muted: "#6b7280",
    border: "rgba(17, 24, 39, 0.12)",
    panel: "rgba(17, 24, 39, 0.04)",
    danger: "#dc2626",
    success: "#16a34a",
    warning: "#d97706",
  },
  spacing: { ...sharedSpacing },
  typography: { ...sharedTypography },
  radius: { ...sharedRadius },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.06)",
    md: "0 8px 24px rgba(17, 24, 39, 0.12)",
    lg: "0 18px 50px rgba(17, 24, 39, 0.14)",
  },
};

export const lightTheme: LessonkitThemeV1 = {
  name: "light",
  colors: {
    background: "#f7f8ff",
    foreground: "rgba(17, 24, 39, 0.92)",
    primary: "#2563eb",
    muted: "rgba(17, 24, 39, 0.64)",
    border: "rgba(17, 24, 39, 0.12)",
    panel: "rgba(17, 24, 39, 0.04)",
    danger: "#e11d48",
    success: "#059669",
    warning: "#d97706",
    extra: {
      accent: "#22d3ee",
      "panel-strong": "rgba(17, 24, 39, 0.06)",
    },
  },
  spacing: { ...sharedSpacing },
  typography: { ...sharedTypography },
  radius: { ...sharedRadius },
  shadows: {
    sm: "0 1px 2px rgba(17, 24, 39, 0.08)",
    md: "0 8px 24px rgba(17, 24, 39, 0.1)",
    lg: "0 18px 50px rgba(17, 24, 39, 0.14)",
  },
};

export const darkTheme: LessonkitThemeV1 = {
  name: "dark",
  colors: {
    background: "#0b1020",
    foreground: "rgba(255, 255, 255, 0.92)",
    primary: "#7c3aed",
    muted: "rgba(255, 255, 255, 0.68)",
    border: "rgba(255, 255, 255, 0.14)",
    panel: "rgba(255, 255, 255, 0.08)",
    danger: "#fb7185",
    success: "#34d399",
    warning: "#fbbf24",
    extra: {
      accent: "#22d3ee",
      "panel-strong": "rgba(255, 255, 255, 0.12)",
    },
  },
  spacing: { ...sharedSpacing },
  typography: { ...sharedTypography },
  radius: { ...sharedRadius },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.2)",
    md: "0 12px 32px rgba(0, 0, 0, 0.28)",
    lg: "0 18px 50px rgba(0, 0, 0, 0.35)",
  },
};

/** Brand deltas merged onto the active mode palette (light/dark). */
export const brandThemeOverrides: PartialLessonkitThemeV1 = {
  name: "brand",
  colors: {
    primary: "#7c3aed",
    extra: {
      accent: "#22d3ee",
    },
  },
};

/** Full dark reference palette for `getPresetTheme("brand")` and catalog validation. */
export const brandTheme: LessonkitThemeV1 = mergeThemes(darkTheme, brandThemeOverrides);

export type ThemePresetName = "default" | "light" | "dark" | "brand";

const PRESETS: Record<ThemePresetName, LessonkitThemeV1> = {
  default: defaultTheme,
  light: lightTheme,
  dark: darkTheme,
  brand: brandTheme,
};

function cloneTheme(theme: LessonkitThemeV1): LessonkitThemeV1 {
  return JSON.parse(JSON.stringify(theme)) as LessonkitThemeV1;
}

export function getPresetTheme(preset: ThemePresetName): LessonkitThemeV1 {
  return cloneTheme(PRESETS[preset]);
}

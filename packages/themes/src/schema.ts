export type ThemeColorKey =
  | "background"
  | "foreground"
  | "primary"
  | "muted"
  | "border"
  | "panel"
  | "danger"
  | "success"
  | "warning";

export type ThemeSpacingKey = "xs" | "sm" | "md" | "lg" | "xl";

export type ThemeTypographyKey =
  | "fontFamily"
  | "fontSizeBase"
  | "lineHeightBase"
  | "fontWeightNormal"
  | "fontWeightStrong";

export type ThemeRadiusKey = "sm" | "md" | "lg";

export type ThemeShadowKey = "sm" | "md" | "lg";

export type LessonkitThemeColors = Record<ThemeColorKey, string> & {
  extra?: Record<string, string>;
};

export type LessonkitThemeSpacing = Record<ThemeSpacingKey, string>;

export type LessonkitThemeTypography = Record<ThemeTypographyKey, string>;

export type LessonkitThemeRadius = Record<ThemeRadiusKey, string>;

export type LessonkitThemeShadows = Record<ThemeShadowKey, string>;

/** Full design token schema v1. */
export type LessonkitThemeV1 = {
  name: string;
  colors: LessonkitThemeColors;
  spacing: LessonkitThemeSpacing;
  typography: LessonkitThemeTypography;
  radius: LessonkitThemeRadius;
  shadows: LessonkitThemeShadows;
};

/** @deprecated Use `LessonkitThemeV1` — alias kept for backward compatibility. */
export type LessonkitTheme = LessonkitThemeV1;

export type PartialLessonkitThemeV1 = {
  name?: string;
  colors?: Partial<LessonkitThemeColors>;
  spacing?: Partial<LessonkitThemeSpacing>;
  typography?: Partial<LessonkitThemeTypography>;
  radius?: Partial<LessonkitThemeRadius>;
  shadows?: Partial<LessonkitThemeShadows>;
};

export type ThemeValidationIssue = {
  path: string;
  message: string;
};

export type ThemeValidationResult =
  | { ok: true; theme: LessonkitThemeV1 }
  | { ok: false; issues: ThemeValidationIssue[] };

const COLOR_KEYS: ThemeColorKey[] = [
  "background",
  "foreground",
  "primary",
  "muted",
  "border",
  "panel",
  "danger",
  "success",
  "warning",
];

const SPACING_KEYS: ThemeSpacingKey[] = ["xs", "sm", "md", "lg", "xl"];

const TYPOGRAPHY_KEYS: ThemeTypographyKey[] = [
  "fontFamily",
  "fontSizeBase",
  "lineHeightBase",
  "fontWeightNormal",
  "fontWeightStrong",
];

const RADIUS_KEYS: ThemeRadiusKey[] = ["sm", "md", "lg"];

const SHADOW_KEYS: ThemeShadowKey[] = ["sm", "md", "lg"];

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function validateRequiredGroup<T extends string>(
  group: string,
  value: unknown,
  keys: readonly T[],
  issues: ThemeValidationIssue[],
): Record<T, string> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    issues.push({ path: group, message: "must be an object" });
    return null;
  }
  const obj = value as Record<string, unknown>;
  const out = {} as Record<T, string>;
  for (const key of keys) {
    const v = obj[key];
    if (!isNonEmptyString(v)) {
      issues.push({ path: `${group}.${key}`, message: "required non-empty string" });
    } else {
      out[key] = v;
    }
  }
  return out;
}

function validateColorsExtra(value: unknown, issues: ThemeValidationIssue[]): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    issues.push({ path: "colors.extra", message: "must be an object when provided" });
    return undefined;
  }
  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (!isNonEmptyString(v)) {
      issues.push({ path: `colors.extra.${k}`, message: "must be a non-empty string" });
    } else {
      extra[k] = v;
    }
  }
  return extra;
}

function rejectUnknownKeys(
  obj: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: ThemeValidationIssue[],
): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      issues.push({ path: path ? `${path}.${key}` : key, message: "unknown property" });
    }
  }
}

/** Validate a value as a complete `LessonkitThemeV1`. */
export function validateTheme(input: unknown): ThemeValidationResult {
  const issues: ThemeValidationIssue[] = [];

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, issues: [{ path: "", message: "theme must be an object" }] };
  }

  const raw = input as Record<string, unknown>;
  rejectUnknownKeys(raw, ["name", "colors", "spacing", "typography", "radius", "shadows"], "", issues);

  if (!isNonEmptyString(raw.name)) {
    issues.push({ path: "name", message: "required non-empty string" });
  }

  const colorsBase = validateRequiredGroup("colors", raw.colors, COLOR_KEYS, issues);
  let colorsExtra: Record<string, string> | undefined;
  if (raw.colors !== null && typeof raw.colors === "object" && !Array.isArray(raw.colors)) {
    const colorsObj = raw.colors as Record<string, unknown>;
    rejectUnknownKeys(colorsObj, [...COLOR_KEYS, "extra"], "colors", issues);
    colorsExtra = validateColorsExtra(colorsObj.extra, issues);
  }

  const spacing = validateRequiredGroup("spacing", raw.spacing, SPACING_KEYS, issues);
  if (raw.spacing !== null && typeof raw.spacing === "object" && !Array.isArray(raw.spacing)) {
    rejectUnknownKeys(raw.spacing as Record<string, unknown>, SPACING_KEYS, "spacing", issues);
  }
  const typography = validateRequiredGroup("typography", raw.typography, TYPOGRAPHY_KEYS, issues);
  if (raw.typography !== null && typeof raw.typography === "object" && !Array.isArray(raw.typography)) {
    rejectUnknownKeys(raw.typography as Record<string, unknown>, TYPOGRAPHY_KEYS, "typography", issues);
  }
  const radius = validateRequiredGroup("radius", raw.radius, RADIUS_KEYS, issues);
  if (raw.radius !== null && typeof raw.radius === "object" && !Array.isArray(raw.radius)) {
    rejectUnknownKeys(raw.radius as Record<string, unknown>, RADIUS_KEYS, "radius", issues);
  }
  const shadows = validateRequiredGroup("shadows", raw.shadows, SHADOW_KEYS, issues);
  if (raw.shadows !== null && typeof raw.shadows === "object" && !Array.isArray(raw.shadows)) {
    rejectUnknownKeys(raw.shadows as Record<string, unknown>, SHADOW_KEYS, "shadows", issues);
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const colors: LessonkitThemeColors = { ...colorsBase! };
  if (colorsExtra && Object.keys(colorsExtra).length > 0) {
    colors.extra = colorsExtra;
  }

  return {
    ok: true,
    theme: {
      name: raw.name as string,
      colors,
      spacing: spacing!,
      typography: typography!,
      radius: radius!,
      shadows: shadows!,
    },
  };
}

export const REQUIRED_COLOR_KEYS = COLOR_KEYS;
export const REQUIRED_SPACING_KEYS = SPACING_KEYS;
export const REQUIRED_TYPOGRAPHY_KEYS = TYPOGRAPHY_KEYS;
export const REQUIRED_RADIUS_KEYS = RADIUS_KEYS;
export const REQUIRED_SHADOW_KEYS = SHADOW_KEYS;

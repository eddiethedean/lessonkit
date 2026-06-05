import type { LessonkitThemeV1 } from "./schema";

/** Reject values that could break out of a CSS declaration block. */
export function sanitizeCssCustomPropertyValue(value: string): string | null {
  if (/[;}\r\n]/.test(value) || value.includes("/*")) return null;
  return value;
}

function assignCssVar(vars: Record<string, string>, key: string, value: string): void {
  const safe = sanitizeCssCustomPropertyValue(value);
  if (safe !== null) vars[key] = safe;
}

/** Map a token path segment to kebab-case for CSS custom property names. */
export function tokenKeyToKebab(key: string): string {
  return key.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/** CSS custom property name for a color token (required keys). */
export function colorVarName(key: string): string {
  return `--lk-color-${tokenKeyToKebab(key)}`;
}

/** CSS custom property name for an extension color. */
export function colorExtraVarName(key: string): string {
  return `--lk-color-extra-${tokenKeyToKebab(key)}`;
}

export function spacingVarName(key: string): string {
  return `--lk-space-${key}`;
}

export function typographyVarName(key: string): string {
  return `--lk-${tokenKeyToKebab(key)}`;
}

export function radiusVarName(key: string): string {
  return `--lk-radius-${key}`;
}

export function shadowVarName(key: string): string {
  return `--lk-shadow-${key}`;
}

/**
 * Convert a complete theme to a flat map of `--lk-*` CSS custom properties.
 * Keys are sorted alphabetically for stable snapshots.
 */
export function themeToCssVariables(theme: LessonkitThemeV1): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(theme.colors)) {
    if (key === "extra" && value && typeof value === "object") {
      for (const [ek, ev] of Object.entries(value as Record<string, string>)) {
        assignCssVar(vars, colorExtraVarName(ek), ev);
      }
    } else if (key !== "extra") {
      assignCssVar(vars, colorVarName(key), value as string);
    }
  }

  for (const [key, value] of Object.entries(theme.spacing)) {
    assignCssVar(vars, spacingVarName(key), value);
  }

  for (const [key, value] of Object.entries(theme.typography)) {
    assignCssVar(vars, typographyVarName(key), value);
  }

  for (const [key, value] of Object.entries(theme.radius)) {
    assignCssVar(vars, radiusVarName(key), value);
  }

  for (const [key, value] of Object.entries(theme.shadows)) {
    assignCssVar(vars, shadowVarName(key), value);
  }

  const sorted: Record<string, string> = {};
  for (const key of Object.keys(vars).sort()) {
    sorted[key] = vars[key]!;
  }
  return sorted;
}

/** Emit a `:root { ... }` or inline style declaration block. */
export function themeToCssDeclarationBlock(
  theme: LessonkitThemeV1,
  opts?: { selector?: string },
): string {
  const selector = opts?.selector ?? ":root";
  const vars = themeToCssVariables(theme);
  const body = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
}

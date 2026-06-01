import {
  colorExtraVarName,
  colorVarName,
  radiusVarName,
  shadowVarName,
  spacingVarName,
  typographyVarName,
} from "./cssVariables";
import {
  REQUIRED_COLOR_KEYS,
  REQUIRED_RADIUS_KEYS,
  REQUIRED_SHADOW_KEYS,
  REQUIRED_SPACING_KEYS,
  REQUIRED_TYPOGRAPHY_KEYS,
} from "./schema";

export type ThemeCatalogEntry = {
  tokenPath: string;
  cssVariable: string;
  type: "color" | "spacing" | "typography" | "radius" | "shadow" | "color-extra";
  required: boolean;
  description: string;
};

const COLOR_DESCRIPTIONS: Record<string, string> = {
  background: "Page and shell background",
  foreground: "Primary text color",
  primary: "Brand and interactive accent",
  muted: "Secondary text and hints",
  border: "Borders and dividers",
  panel: "Card and panel surfaces",
  danger: "Errors and high-risk states",
  success: "Success and positive feedback",
  warning: "Warnings and caution states",
};

const SPACING_DESCRIPTIONS: Record<string, string> = {
  xs: "Extra-small spacing",
  sm: "Small spacing",
  md: "Medium spacing",
  lg: "Large spacing",
  xl: "Extra-large spacing",
};

const TYPOGRAPHY_DESCRIPTIONS: Record<string, string> = {
  fontFamily: "Base font stack",
  fontSizeBase: "Base font size",
  lineHeightBase: "Base line height",
  fontWeightNormal: "Normal text weight",
  fontWeightStrong: "Headings and emphasis weight",
};

const RADIUS_DESCRIPTIONS: Record<string, string> = {
  sm: "Small corner radius",
  md: "Medium corner radius",
  lg: "Large corner radius",
};

const SHADOW_DESCRIPTIONS: Record<string, string> = {
  sm: "Small elevation shadow",
  md: "Medium elevation shadow",
  lg: "Large elevation shadow",
};

/** Enumerable catalog of themeable tokens (v1). */
export function buildThemeCatalog(): ThemeCatalogEntry[] {
  const entries: ThemeCatalogEntry[] = [];

  for (const key of REQUIRED_COLOR_KEYS) {
    entries.push({
      tokenPath: `colors.${key}`,
      cssVariable: colorVarName(key),
      type: "color",
      required: true,
      /* v8 ignore next -- REQUIRED_COLOR_KEYS are fully described above */
      description: COLOR_DESCRIPTIONS[key] ?? `Color token: ${key}`,
    });
  }

  entries.push({
    tokenPath: "colors.extra.*",
    cssVariable: "--lk-color-extra-{key}",
    type: "color-extra",
    required: false,
    description: "Optional extension colors (non-stable until 1.0)",
  });

  for (const key of REQUIRED_SPACING_KEYS) {
    entries.push({
      tokenPath: `spacing.${key}`,
      cssVariable: spacingVarName(key),
      type: "spacing",
      required: true,
      /* v8 ignore next -- REQUIRED_SPACING_KEYS are fully described above */
      description: SPACING_DESCRIPTIONS[key] ?? `Spacing token: ${key}`,
    });
  }

  for (const key of REQUIRED_TYPOGRAPHY_KEYS) {
    entries.push({
      tokenPath: `typography.${key}`,
      cssVariable: typographyVarName(key),
      type: "typography",
      required: true,
      /* v8 ignore next -- REQUIRED_TYPOGRAPHY_KEYS are fully described above */
      description: TYPOGRAPHY_DESCRIPTIONS[key] ?? `Typography token: ${key}`,
    });
  }

  for (const key of REQUIRED_RADIUS_KEYS) {
    entries.push({
      tokenPath: `radius.${key}`,
      cssVariable: radiusVarName(key),
      type: "radius",
      required: true,
      /* v8 ignore next -- REQUIRED_RADIUS_KEYS are fully described above */
      description: RADIUS_DESCRIPTIONS[key] ?? `Radius token: ${key}`,
    });
  }

  for (const key of REQUIRED_SHADOW_KEYS) {
    entries.push({
      tokenPath: `shadows.${key}`,
      cssVariable: shadowVarName(key),
      type: "shadow",
      required: true,
      /* v8 ignore next -- REQUIRED_SHADOW_KEYS are fully described above */
      description: SHADOW_DESCRIPTIONS[key] ?? `Shadow token: ${key}`,
    });
  }

  return entries;
}

/** Example extension color variable name for documentation. */
export { colorExtraVarName };

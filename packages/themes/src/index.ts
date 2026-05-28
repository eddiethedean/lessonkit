export type {
  LessonkitTheme,
  LessonkitThemeV1,
  LessonkitThemeColors,
  LessonkitThemeRadius,
  LessonkitThemeShadows,
  LessonkitThemeSpacing,
  LessonkitThemeTypography,
  PartialLessonkitThemeV1,
  ThemeColorKey,
  ThemeRadiusKey,
  ThemeShadowKey,
  ThemeSpacingKey,
  ThemeTypographyKey,
  ThemeValidationIssue,
  ThemeValidationResult,
} from "./schema";

export {
  REQUIRED_COLOR_KEYS,
  REQUIRED_RADIUS_KEYS,
  REQUIRED_SHADOW_KEYS,
  REQUIRED_SPACING_KEYS,
  REQUIRED_TYPOGRAPHY_KEYS,
  validateTheme,
} from "./schema";

export { mergeThemes } from "./merge";

export {
  colorExtraVarName,
  colorVarName,
  radiusVarName,
  shadowVarName,
  spacingVarName,
  themeToCssDeclarationBlock,
  themeToCssVariables,
  tokenKeyToKebab,
  typographyVarName,
} from "./cssVariables";

export {
  brandTheme,
  brandThemeOverrides,
  darkTheme,
  defaultTheme,
  getPresetTheme,
  lightTheme,
  type ThemePresetName,
} from "./presets";

export { buildThemeCatalog, type ThemeCatalogEntry } from "./catalog";

import { getPresetTheme, themeToCssVariables, type LessonkitThemeV1, type ThemePresetName } from "@lessonkit/themes";

export type LxpackRuntimeTheme = {
  theme: string;
  cssVariables: Record<string, string>;
};

export function themeToLxpackRuntime(input: {
  preset?: ThemePresetName;
  theme?: LessonkitThemeV1;
}): LxpackRuntimeTheme {
  const theme = input.theme ?? getPresetTheme(input.preset ?? "default");
  const raw = themeToCssVariables(theme);
  const cssVariables: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    cssVariables[key] = String(value);
  }
  return {
    theme: theme.name,
    cssVariables,
  };
}

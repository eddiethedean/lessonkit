import type { LessonkitThemeColors, LessonkitThemeV1, PartialLessonkitThemeV1 } from "./schema";

function mergeExtra(
  base: Record<string, string> | undefined,
  override: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!base && !override) return undefined;
  return { ...base, ...override };
}

function mergeColors(
  base: LessonkitThemeColors,
  override: Partial<LessonkitThemeColors> | undefined,
): LessonkitThemeColors {
  if (!override) return base;
  const { extra: overrideExtra, ...rest } = override;
  const merged = { ...base, ...rest } as LessonkitThemeColors;
  const extra = mergeExtra(base.extra, overrideExtra);
  if (extra) merged.extra = extra;
  else delete merged.extra;
  return merged;
}

function mergeGroup<T extends Record<string, string>>(
  base: T,
  override: Partial<T> | undefined,
): T {
  if (!override) return base;
  return { ...base, ...override };
}

/**
 * Deep-merge theme objects left-to-right. Last writer wins for leaf token values.
 */
export function mergeThemes(
  base: LessonkitThemeV1,
  ...overrides: (PartialLessonkitThemeV1 | undefined)[]
): LessonkitThemeV1 {
  let result: LessonkitThemeV1 = { ...base };

  for (const o of overrides) {
    if (!o) continue;
    result = {
      name: o.name ?? result.name,
      colors: mergeColors(result.colors, o.colors),
      spacing: mergeGroup(result.spacing, o.spacing),
      typography: mergeGroup(result.typography, o.typography),
      radius: mergeGroup(result.radius, o.radius),
      shadows: mergeGroup(result.shadows, o.shadows),
    };
  }

  return result;
}

# `@lessonkit/themes`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![npm](https://img.shields.io/npm/v/@lessonkit/themes.svg)](https://www.npmjs.com/package/@lessonkit/themes)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Design tokens and theme utilities for LessonKit.

**Docs:** [Theming reference](https://lessonkit.readthedocs.io/en/latest/reference/theming.html) · [Theming & accessibility guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/theming-and-accessibility.html)

## Install

```bash
npm install @lessonkit/themes
```

## API (0.6.0)

### Types

- `LessonkitThemeV1` — full token schema v1
- `LessonkitTheme` — alias for `LessonkitThemeV1`
- `PartialLessonkitThemeV1` — partial overrides for merge / `ThemeProvider`

### Presets

- `defaultTheme`, `lightTheme`, `darkTheme`, `brandTheme`, `brandThemeOverrides`
- `getPresetTheme(preset)` — `default` | `light` | `dark` | `brand` (full themes for catalog/validation)

In `ThemeProvider`, `preset="default"` uses the mode palette only; `preset="brand"` merges `brandThemeOverrides` onto the active mode (see [theming reference](https://lessonkit.readthedocs.io/en/latest/reference/theming.html)).

### Utilities

- `validateTheme(input)` — validate unknown input
- `mergeThemes(base, ...overrides)` — deep merge, last writer wins
- `themeToCssVariables(theme)` — flat `--lk-*` map (sorted keys)
- `themeToCssDeclarationBlock(theme)` — `:root { ... }` text
- `buildThemeCatalog()` — enumerable token metadata

### Machine-readable exports

```json
{
  "imports": {
    "@lessonkit/themes/theme-contract.v1.json": "./theme-contract.v1.json",
    "@lessonkit/themes/theme-catalog.v1.json": "./theme-catalog.v1.json",
    "@lessonkit/themes/base.css": "./base.css"
  }
}
```

## Docs

See the [theming reference](https://lessonkit.readthedocs.io/en/latest/reference/theming.html) for the CSS variable contract and override rules.

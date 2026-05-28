# `@lessonkit/themes`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@lessonkit/themes.svg)](https://www.npmjs.com/package/@lessonkit/themes)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](../../LICENSE)

Design tokens and theme utilities for LessonKit.

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

In `ThemeProvider`, `preset="default"` uses the mode palette only; `preset="brand"` merges `brandThemeOverrides` onto the active mode (see [`docs/THEMING.md`](../../docs/THEMING.md)).

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

See [`docs/THEMING.md`](../../docs/THEMING.md) for the CSS variable contract and override rules.

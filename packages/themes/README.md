# @lessonkit/themes

[![npm](https://img.shields.io/npm/v/@lessonkit/themes.svg)](https://www.npmjs.com/package/@lessonkit/themes)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/reference/theming.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Design tokens, presets, and CSS variable utilities for LessonKit.

## Install

```bash
npm install @lessonkit/themes
```

## Usage

```typescript
import { getPresetTheme, mergeThemes, themeToCssVariables } from "@lessonkit/themes";

const theme = mergeThemes(getPresetTheme("light"), { colors: { primary: "#0066cc" } });
const vars = themeToCssVariables(theme); // { "--lk-color-primary": "#0066cc", ... }
```

**Presets:** `default`, `light`, `dark`, `brand` via `getPresetTheme()`

**Utilities:** `validateTheme()`, `mergeThemes()`, `themeToCssDeclarationBlock()`, `buildThemeCatalog()`

**Assets:** `theme-contract.v1.json`, `theme-catalog.v1.json`, `base.css`

Pair with `ThemeProvider` from `@lessonkit/react` for runtime theming.

## Docs

[Theming reference](https://lessonkit.readthedocs.io/en/latest/reference/theming.html)

## License

Apache-2.0

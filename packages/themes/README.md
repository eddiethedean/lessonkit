# @lessonkit/themes

[![npm](https://img.shields.io/npm/v/@lessonkit/themes.svg)](https://www.npmjs.com/package/@lessonkit/themes)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/reference/theming.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Design tokens, presets, and CSS variable utilities for LessonKit.

## When to install

- Custom theme presets beyond `ThemeProvider` defaults
- Generating `--lk-*` CSS variables for non-React shells
- Validating theme tokens against `theme-contract.v1.json`

`@lessonkit/react` includes `ThemeProvider` and depends on this package.

## Install

```bash
npm install @lessonkit/themes
```

## Usage

```typescript
import { getPresetTheme, mergeThemes, themeToCssVariables } from "@lessonkit/themes";

const theme = mergeThemes(getPresetTheme("brand"), {
  colors: { primary: "#0066cc" },
});
const vars = themeToCssVariables(theme); // { "--lk-color-primary": "#0066cc", ... }
```

In React courses, prefer `ThemeProvider`:

```tsx
import { ThemeProvider } from "@lessonkit/react";

<ThemeProvider mode="light" preset="brand">
  <Course ... />
</ThemeProvider>
```

**Presets:** `default`, `light`, `dark`, `brand` via `getPresetTheme()`

**Utilities:** `validateTheme()`, `mergeThemes()`, `themeToCssDeclarationBlock()`, `buildThemeCatalog()`

**Assets:** `theme-contract.v1.json`, `theme-catalog.v1.json`, `base.css`

## Docs

[Theming reference](https://lessonkit.readthedocs.io/en/latest/reference/theming.html) · [Theming & accessibility guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/theming-and-accessibility.html) · [TypeDoc API index](https://lessonkit.readthedocs.io/en/latest/reference/api.html)

## License

Apache-2.0

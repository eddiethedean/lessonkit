# @lessonkit/accessibility

[![npm](https://img.shields.io/npm/v/@lessonkit/accessibility.svg)](https://www.npmjs.com/package/@lessonkit/accessibility)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/reference/accessibility.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Focus management, reduced-motion helpers, and screen-reader utilities for LessonKit apps.

## Install

```bash
npm install @lessonkit/accessibility
```

## API

| Export | Purpose |
| --- | --- |
| `prefersReducedMotion()` | Media-query check |
| `shouldAnimate({ default })` | Respect user preference |
| `focusFirst`, `getFocusableElements` | Focus discovery |
| `trapFocus(container, opts)` | Focus trap for modals |
| `createRovingTabIndex(opts)` | Roving tabindex groups |
| `visuallyHiddenStyle` | Screen-reader-only content |

Used internally by `@lessonkit/react` (e.g. `Quiz` labels).

## Docs

[Accessibility reference](https://lessonkit.readthedocs.io/en/latest/reference/accessibility.html) · [Theming & accessibility guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/theming-and-accessibility.html)

## License

Apache-2.0

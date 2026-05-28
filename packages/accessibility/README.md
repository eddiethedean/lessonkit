# `@lessonkit/accessibility`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml)
[![npm](https://img.shields.io/npm/v/@lessonkit/accessibility.svg)](https://www.npmjs.com/package/@lessonkit/accessibility)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](../../LICENSE)

Small accessibility utilities used by LessonKit packages and apps.

## Install

```bash
npm install @lessonkit/accessibility
```

## Included (0.3.0)

- `prefersReducedMotion()`
- `getReducedMotionPreference()`
- `shouldAnimate({ default })`
- `focusFirst(container)`
- `getFocusableElements(container)`
- `trapFocus(container, opts)`
- `createRovingTabIndex(opts)`
- `visuallyHiddenStyle` — inline styles for screen-reader-only content (used by `@lessonkit/react` `Quiz`)

## Guidance

- See [`docs/ACCESSIBILITY.md`](../../docs/ACCESSIBILITY.md) for keyboard and screen-reader guidance.


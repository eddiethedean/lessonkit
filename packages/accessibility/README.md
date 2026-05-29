# `@lessonkit/accessibility`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![npm](https://img.shields.io/npm/v/@lessonkit/accessibility.svg)](https://www.npmjs.com/package/@lessonkit/accessibility)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](../../LICENSE)

Small accessibility utilities used by LessonKit packages and apps.

**Docs:** [Accessibility reference](https://lessonkit.readthedocs.io/en/latest/reference/accessibility.html) · [Theming & accessibility guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/theming-and-accessibility.html)

## Install

```bash
npm install @lessonkit/accessibility
```

## Included (0.6.0)

- `prefersReducedMotion()`
- `getReducedMotionPreference()`
- `shouldAnimate({ default })`
- `focusFirst(container)`
- `getFocusableElements(container)`
- `trapFocus(container, opts)`
- `createRovingTabIndex(opts)`
- `visuallyHiddenStyle` — inline styles for screen-reader-only content (used by `@lessonkit/react` `Quiz`)

## Guidance

See the [accessibility reference](https://lessonkit.readthedocs.io/en/latest/reference/accessibility.html) for keyboard and screen-reader guidance.

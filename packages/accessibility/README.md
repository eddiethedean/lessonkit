# @lessonkit/accessibility

[![npm](https://img.shields.io/npm/v/@lessonkit/accessibility.svg)](https://www.npmjs.com/package/@lessonkit/accessibility)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Focus management, reduced-motion helpers, and screen-reader utilities for LessonKit apps.

## When to install

- Custom interactive UI outside `@lessonkit/react` blocks
- Modal dialogs, custom carousels, or roving-tabindex toolbars in your course shell

`@lessonkit/react` uses this package internally (for example `Quiz` labels and compound keyboard nav).

## Install

```bash
npm install @lessonkit/accessibility
```

## Usage

```typescript
import {
  trapFocus,
  focusFirst,
  prefersReducedMotion,
  shouldAnimate,
  createRovingTabIndex,
} from "@lessonkit/accessibility";

const release = trapFocus(dialogElement, { onEscape: closeDialog });
// call release() when the dialog closes
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

## Docs

[Accessibility reference](https://lessonkit.readthedocs.io/en/latest/reference/accessibility.html) · [Theming & accessibility guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/theming-and-accessibility.html) · [Accessibility conformance](https://lessonkit.readthedocs.io/en/latest/project/accessibility-conformance.html) · [TypeDoc API index](https://lessonkit.readthedocs.io/en/latest/reference/api.html)

## License

Apache-2.0

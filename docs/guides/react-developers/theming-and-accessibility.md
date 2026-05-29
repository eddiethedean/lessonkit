# Theming and accessibility

## Theming

```tsx
import { ThemeProvider } from "@lessonkit/react";

<ThemeProvider mode="light" preset="default">
  <Course ... />
</ThemeProvider>
```

- `mode`: `light` | `dark` | `system`
- `preset`: `default` | `brand` (and custom presets via `@lessonkit/themes`)

`ThemeProvider` sets `--lk-*` CSS variables on a wrapper element. Style your content with those variables or plain CSS in `styles.css`.

Align `lessonkit.json` → `course.theme.preset` with the React preset for packaging parity.

Details: [Theming reference](../../reference/theming.md).

## Accessibility built into components

- Semantic regions (`article`, `section`, `fieldset`)
- Quiz legends use visually hidden text (no `.sr-only` class required)
- `aria-live` feedback on quiz selection

## `@lessonkit/accessibility` utilities

Use when building custom modals or nav:

- `trapFocus(container)` — focus trap with Tab cycling
- `createRovingTabIndex({ itemCount, orientation })` — toolbar/tablist patterns
- `prefersReducedMotion()` / `shouldAnimate()`
- `visuallyHiddenStyle` — inline SR-only styles

Standards and targets: [Accessibility reference](../../reference/accessibility.md).

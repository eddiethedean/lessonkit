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

Import `@lessonkit/themes/base.css` for **touch-sized controls** (`--lk-touch-target-min`, `lk-button`, drag chips, grid cells). See [Touch and mobile](touch-and-mobile.md).

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

## Pre-ship accessibility checklist (course authors)

Complete before LMS upload for every block type used in your course:

### Keyboard

- [ ] Tab through the full course without keyboard traps (except intentional modals using `trapFocus`)
- [ ] Quiz and assessment blocks: arrow keys or Tab reach all choices; Enter/Space activates
- [ ] Compound blocks (`SlideDeck`, `InteractiveBook`, `BranchingScenario`): documented keyboard nav works (arrows, Home/End where applicable)
- [ ] Focus visible on all interactive elements

### Screen reader

- [ ] Course title announced (`Course` h1 / `aria-label`)
- [ ] Quiz feedback uses live region (built into `Quiz` — verify in your theme CSS)
- [ ] Images have alt text; decorative images use empty alt
- [ ] Custom content outside LessonKit blocks uses headings in logical order (h1 → h2 → h3)

### LMS iframe

- [ ] Test packaged SCORM in **staging LMS**, not only `npm run dev`
- [ ] Bridge completion fires with `allowedParentOrigins` set (see [LMS Go-Live](lms-go-live.md))
- [ ] No horizontal scroll at 320px width unless intentional

### Reduced motion

- [ ] Enable **Reduce motion** in OS settings; verify animations respect `prefers-reduced-motion` (e.g. `ParallaxSlideshow` fallback)

### Sign-off

Document results in your release checklist. Framework conformance statement: [Accessibility conformance (interim)](../../project/accessibility-conformance.md).

# Accessibility (framework 1.x)

This document defines accessibility expectations for LessonKit authors and implementers.

## WCAG targets vs verification

| Area | Target | Status |
| --- | --- | --- |
| Keyboard operation | WCAG 2.1 AA patterns for shipped blocks | Implemented per component; see [block catalog](reference/block-catalog.md) a11y notes |
| Focus management | Visible focus, trap/roving helpers in `@lessonkit/accessibility` | Utilities documented below |
| Reduced motion | Respect `prefers-reduced-motion` | `shouldAnimate()` helper + component fallbacks |
| Formal VPAT / third-party audit | — | **Not published**; evaluate with your QA process before enterprise rollout |

Shipped components use semantic regions, quiz `aria-live` feedback, and keyboard alternatives for drag/drop where applicable. Custom UI must follow the same patterns—see [Theming and accessibility guide](../guides/react-developers/theming-and-accessibility.md).

## Keyboard navigation standards

- **Use Tab for global navigation** between interactive elements (links, buttons, form controls).
- **Use arrow keys only inside composite widgets** (e.g. custom radio groups, listboxes, tabs). If you implement a composite widget, use a **roving tabindex** strategy so only one item is tabbable at a time.
- **Keep focus visible**. Avoid removing outlines without providing an equivalent focus indicator.
- **Programmatic focus is allowed** when it prevents “focus loss” (e.g. opening a modal should move focus into it; closing should restore focus).

### When to use a focus trap

Use a focus trap for **modal dialogs** (or any UI that must keep the user inside a temporary context).

Recommended pattern:

- Activate trap on open
- Set initial focus to the first meaningful control (or a provided element)
- Restore focus on close

LessonKit provides utility helpers in `@lessonkit/accessibility`:

- `trapFocus(container, opts)` — loops Tab/Shift+Tab inside the container.
- `getFocusableElements(container)` — returns the current tabbable elements under a container.

### When to use roving tabindex

Use roving tabindex for:

- Option pickers rendered as custom buttons
- Horizontal/vertical navigators
- Any widget where arrow keys should move the active item without leaving the widget

LessonKit provides:

- `createRovingTabIndex({ itemCount, orientation, loop, initialIndex })`

## Reduced motion

If the OS/browser requests reduced motion (`prefers-reduced-motion: reduce`), animations should be minimized or disabled.

LessonKit provides:

- `prefersReducedMotion()` — boolean helper
- `getReducedMotionPreference()` — `"reduce" | "no-preference" | "unknown"`
- `shouldAnimate({ default })` — returns false when preference is `reduce`

## Quiz screen-reader announcements

### Recommended pattern (status region)

For correctness feedback, use a status region that is updated when the user answers:

- `role="status"`
- `aria-live="polite"`

LessonKit’s `Quiz` component follows this pattern and displays feedback in a live region.

### Avoid duplicate announcements

- Keep the live region small and stable; update only the text content that must be announced.
- Avoid placing an `aria-live` region inside another `aria-live` region.
- Do not shift focus to the status message; let screen readers announce it naturally.

### When to use `aria-describedby`

If feedback should be associated with a specific form control (rather than announced globally), consider `aria-describedby` on the control pointing at a static feedback element. Use `aria-live` when the feedback must be announced immediately.


# Theming (1.0+)

LessonKit uses a **token-based theme contract** shared across React apps, templates, and (in a future release) LXPack-packaged artifacts.

## Packages

- **`@lessonkit/themes`** — schema, presets, merge rules, CSS variable mapping
- **`@lessonkit/react`** — `ThemeProvider` / `useTheme` inject tokens at runtime

## CSS variable contract

All framework tokens map to namespaced custom properties with the prefix **`--lk-`**.

| Token path | CSS variable |
|------------|--------------|
| `colors.primary` | `--lk-color-primary` |
| `colors.background` | `--lk-color-background` |
| `spacing.md` | `--lk-space-md` |
| `typography.fontFamily` | `--lk-font-family` |
| `radius.lg` | `--lk-radius-lg` |
| `shadows.md` | `--lk-shadow-md` |
| `colors.extra.accent` | `--lk-color-extra-accent` |

Required token groups: **colors**, **spacing**, **typography**, **radius**, **shadows**. Optional `colors.extra` keys are supported but considered **non-stable until 1.0**.

The provider sets `data-lk-theme="light"` or `data-lk-theme="dark"` on the document root (and on scoped hosts) so author CSS can target modes:

```css
[data-lk-theme="light"] .nav {
  box-shadow: var(--lk-shadow-md);
}
```

## Override precedence

1. **Preset base** — `default`, `light`, `dark`, or `brand` from `@lessonkit/themes`
2. **Mode** — `light` / `dark` / `system` selects a light or dark palette (system follows `prefers-color-scheme`)

`preset="default"` in `ThemeProvider` means **mode palette only** (light or dark tokens). It does not apply the exported `defaultTheme` object (white reference palette); use `defaultTheme` from `@lessonkit/themes` for catalogs, validation, or non-React tooling. The `brand` preset merges only brand deltas (primary, accent) onto the active mode palette so light/dark toggles stay correct.
3. **`theme` prop** — partial overrides merged last (last writer wins per leaf token)
4. **Author CSS** — rules on `:root` or `[data-lk-theme]` override injected inline variables

Use `mergeThemes()` from `@lessonkit/themes` for the same merge semantics outside React.

## React usage

```tsx
import { ThemeProvider, Course, Lesson } from "@lessonkit/react";

export default function App() {
  return (
    <ThemeProvider mode="dark" preset="brand" theme={{ colors: { primary: "#7c3aed" } }}>
      <Course title="Training" courseId="training-101">
        <Lesson title="Intro" lessonId="intro">
          <p style={{ color: "var(--lk-color-foreground)" }}>Hello</p>
        </Lesson>
      </Course>
    </ThemeProvider>
  );
}
```

### `ThemeProvider` props

| Prop | Description |
|------|-------------|
| `preset` | `default` \| `light` \| `dark` \| `brand` |
| `mode` | `light` \| `dark` \| `system` |
| `theme` | Partial `LessonkitThemeV1` merged on top |
| `target` | `document` (default, `:root`) or `element` (scoped host `div`) |

### Hooks

- `useTheme()` — returns `{ theme, preset, mode, resolvedMode }`

## Machine-readable catalog (generators)

Import JSON from the published package:

- `@lessonkit/themes/theme-contract.v1.json` — JSON Schema for a full theme
- `@lessonkit/themes/theme-catalog.v1.json` — enumerable token list (path, CSS var, type, required, description)

Programmatic catalog: `buildThemeCatalog()` from `@lessonkit/themes`.

## Optional base CSS

```css
@import "@lessonkit/themes/base.css";
```

Provides `.lk-panel` and `.lk-button` primitives that consume only `--lk-*` variables.

## LXPack parity (0.6+)

Use `themeToLxpackRuntime()` from `@lessonkit/lxpack` to write the same `--lk-*` variables into the LXPack `course.yaml` `runtime.cssVariables` block when packaging.

```ts
import { themeToLxpackRuntime } from "@lessonkit/lxpack";

const { theme, cssVariables } = themeToLxpackRuntime({ preset: "brand" });
```

See [Packaging reference](reference/packaging.md) and [LXPack interoperability](reference/lxpack-upgrades.md).

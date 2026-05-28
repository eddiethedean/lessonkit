# Documentation

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](../LICENSE)

This folder contains documentation for LessonKit.

## Planned documentation sites

- **Storybook**: component documentation for `@lessonkit/react`
- **Docusaurus**: framework documentation (guides, concepts, API reference)

Placeholders live here until the full docs stack is scaffolded:

- [`docs/storybook/`](https://github.com/eddiethedean/lessonkit/tree/main/docs/storybook)
- [`docs/site/`](https://github.com/eddiethedean/lessonkit/tree/main/docs/site)

## Guides

- [`THEMING.md`](THEMING.md) — design tokens, `--lk-*` CSS variables, and `ThemeProvider`
- [`IDENTITY.md`](IDENTITY.md) — required IDs, URN contract, codegen guidance
- [`TELEMETRY.md`](TELEMETRY.md) — event catalog and xAPI mapping
- [`ACCESSIBILITY.md`](ACCESSIBILITY.md) — keyboard and screen reader standards

## Integration

- [`LXPACK_UPGRADES_FOR_LESSONKIT.md`](https://github.com/eddiethedean/lessonkit/blob/main/docs/LXPACK_UPGRADES_FOR_LESSONKIT.md) — proposed LXPack changes to support LessonKit packaging

## Current status

Framework **0.5.0** (identity model, telemetry catalog, canonical xAPI mapper, lesson lifecycle
hardening, themes) is implemented in `packages/` and documented in the guides above. Storybook and
Docusaurus folders remain placeholders until the docs stack is scaffolded.

**Publishing:** npm latest is still **0.4.0** until you push the `v0.5.0` tag (see [RELEASING.md](../RELEASING.md)).


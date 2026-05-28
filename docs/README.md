# Documentation

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
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
- [`PACKAGING.md`](PACKAGING.md) — export to SCORM / standalone via `@lessonkit/lxpack`

## Integration

- [`LXPACK_UPGRADES_FOR_LESSONKIT.md`](LXPACK_UPGRADES_FOR_LESSONKIT.md) — LXPack interoperability checklist

## Current status

Framework **0.6.0** adds `@lessonkit/lxpack` (LXPack export adapter), packaging docs, and a golden
SCORM example. Identity, telemetry, themes, and lesson lifecycle from **0.5.0** are documented in
the guides above. Storybook and Docusaurus folders remain placeholders until the docs stack is
scaffolded.

**Publishing:** see [RELEASING.md](../RELEASING.md) for tag-based npm releases.


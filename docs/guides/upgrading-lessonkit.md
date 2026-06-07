# Upgrading LessonKit

Pick the migration guide for your **current** version. After upgrading, run `lessonkit build`, fix TypeScript errors, then `lessonkit package` smoke test.

:::{admonition} Pin aligned versions
:class: important

Bump all `@lessonkit/*` packages to the same semver (for example **1.5.0**). Mismatched workspace versions cause subtle runtime bugs.
:::

## Migration guides

**Latest:** [MIGRATION-1.4-to-1.5](../MIGRATION-1.4-to-1.5.md) (current npm line **1.5.x**).

Older jumps (linked from the table below and the [detailed migration pages](#detailed-migration-pages) section):

| From | To | Guide |
| --- | --- | --- |
| 1.4.x | 1.5.x | [MIGRATION-1.4-to-1.5](../MIGRATION-1.4-to-1.5.md) — `BranchingScenario`, `Embed`, `Chart`, branch resume |
| 1.3.x | 1.4.x | [MIGRATION-1.3-to-1.4](../MIGRATION-1.3-to-1.4.md) — `InteractiveVideo`, Tier B/C/D blocks, production guard |
| 1.2.x | 1.3.x | [MIGRATION-1.2-to-1.3](../MIGRATION-1.2-to-1.3.md) — `SlideDeck`, transport helpers |
| 1.1.x | 1.2.x | [MIGRATION-1.1-to-1.2](../MIGRATION-1.1-to-1.2.md) — catalog v3 default, compound persistence |
| 1.0.x | 1.1.x | [MIGRATION-1.0-to-1.1](../MIGRATION-1.0-to-1.1.md) |
| 0.9.x | 1.0.x | [MIGRATION-0.x-to-1.0](../MIGRATION-0.x-to-1.0.md) |

Historical release checklists: [Release history](../project/release-history.md).

## Quick checklist (any upgrade)

1. Read the migration guide for your jump.
2. Update `package.json` `@lessonkit/*` pins.
3. Re-run `npm install`.
4. Search for deprecated APIs (test reset helpers → `@lessonkit/react/testing`).
5. Run `npm run build` and `lessonkit package --target scorm12` in your course project.
6. Review [CHANGELOG](../project/changelog.md) for security and behavior fixes.

## AI-assisted upgrades

Install the **lessonkit-migrate** [Library Skill](library-skills.md) for Cursor / Claude Code—it links to the same guides above.

## New projects

If you used `npx @lessonkit/cli init` recently on the latest CLI, you likely do not need a migration—skip unless you are bumping an existing course repo.

## Detailed migration pages

```{toctree}
:hidden:
:maxdepth: 1

../MIGRATION-1.4-to-1.5
../MIGRATION-1.3-to-1.4
../MIGRATION-1.2-to-1.3
../MIGRATION-1.1-to-1.2
../MIGRATION-1.0-to-1.1
../MIGRATION-0.x-to-1.0
```

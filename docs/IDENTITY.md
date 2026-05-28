# Identity model (v1)

LessonKit **0.5.0** requires explicit, stable identifiers for courses, lessons, and knowledge checks.
Generators and authors must supply IDs in source — the runtime does not invent lesson or check IDs.

## Required props

| Surface | Prop | Required |
|---------|------|----------|
| `Course` | `courseId` | Yes |
| `LessonkitProvider` config | `courseId` | Yes |
| `Lesson` | `lessonId` | Yes |
| `Quiz` / `KnowledgeCheck` | `checkId` | Yes |
| `Scenario` / `Reflection` | `blockId` | No (optional; included in `interaction` telemetry when set) |

## ID format

- Pattern: `^[a-zA-Z][a-zA-Z0-9_-]{0,63}$` (1–64 characters, must start with a letter)
- Validate with `validateId()` from `@lessonkit/core`
- Propose IDs from titles with `slugifyId(title)` and `deriveId(title, usedIds)` (collision suffix `-2`, `-3`, …)

## URN contract

Stable URNs are used for xAPI `object.id` and future LXPack export:

```text
urn:lessonkit:course:{courseId}
urn:lessonkit:course:{courseId}:lesson:{lessonId}
urn:lessonkit:course:{courseId}:lesson:{lessonId}:check:{checkId}
urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}
```

Build with `buildLessonkitUrn({ courseId, lessonId?, checkId?, blockId? })` from `@lessonkit/core`.

Machine-readable rules: `@lessonkit/core/identity-contract.v1.json`.

## Regenerate code (generators & Studio)

1. **Preserve IDs in source** — never rely on runtime-generated lesson IDs (removed in 0.5.0).
2. When adding content, call `deriveId(title, existingIds)` once at codegen time and write the result into props.
3. Keep `courseId` stable for the life of a course repo; changing it breaks analytics continuity and export mapping.
4. Prefer semantic slugs (`phishing-101`, `email-first-step`) over opaque UUIDs unless your pipeline already uses UUIDs everywhere.

## Migration from 0.4.x

1. Add `courseId` on every `Course` (and `courseId` on `LessonkitProvider` if used directly).
2. Add `lessonId` on every `Lesson` (remove reliance on auto-generated `lesson-*` IDs).
3. Add `checkId` on every `Quiz` and `KnowledgeCheck`.
4. Optionally add `blockId` on `Scenario` / `Reflection` when you want block-level xAPI for custom `interaction` events (pass `blockId` in `track("interaction", { …, blockId })`).

See also [`TELEMETRY.md`](TELEMETRY.md) and [`CHANGELOG.md`](../CHANGELOG.md).

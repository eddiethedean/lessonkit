# Identity (courseId, lessonId, checkId)

## Pattern

Each ID: starts with a letter; letters, digits, `_`, `-` only; max 64 characters.

## Sync checklist

| React | lessonkit.json |
|-------|----------------|
| `<Course courseId="cyber-basics">` | `course.courseId` |
| `<Lesson lessonId="phishing-101">` | `course.lessons[].id` |
| `<Quiz checkId="first-step">` | `course.assessments[].checkId` |

## URNs (telemetry / xAPI)

`urn:lessonkit:course:{courseId}:lesson:{lessonId}` — built by `@lessonkit/core` `buildLessonkitUrn`.

## Init behavior

`lessonkit init` slugifies the directory name into a valid `courseId` and patches `App.tsx`.

Human reference: https://lessonkit.readthedocs.io/en/latest/reference/identity.html

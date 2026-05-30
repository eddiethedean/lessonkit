# lessonkit.json (schemaVersion 1)

## Minimal example

```json
{
  "schemaVersion": 1,
  "name": "my-course",
  "course": {
    "courseId": "my-course",
    "title": "My Course",
    "layout": "single-spa",
    "spaLessonId": "main",
    "lessons": [{ "id": "main", "title": "Main lesson" }],
    "assessments": [
      {
        "checkId": "final-check",
        "question": "Best practice?",
        "choices": ["Wrong", "Right"],
        "answer": "Right",
        "passingScore": 1
      }
    ],
    "theme": { "preset": "default" }
  },
  "paths": {
    "spaDistDir": "dist",
    "lxpackOutDir": ".lxpack/course",
    "outputBaseDir": ".lxpack/out"
  }
}
```

## Rules

- `layout`: use `single-spa` for CLI `lessonkit package` (1.0.0).
- `spaLessonId`: lesson id that hosts the built SPA in the package.
- Assessments in JSON are used by LXPack packaging; React `Quiz` must use the same `checkId`.

Human reference: https://lessonkit.readthedocs.io/en/latest/reference/cli.html

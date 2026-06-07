# Vibe coding starter context

Paste once per chat session:

```text
Project: LessonKit 1.5.x (Vite 8 + React 19).
Manifest: lessonkit.json (schemaVersion 1).
Main UI: src/App.tsx; production config: src/courseConfig.ts.
Block catalog: @lessonkit/react/block-catalog.v3.json (only use listed block types).
Rules:
- Keep courseId, lessonId, checkId stable; sync lessonkit.json when adding lessons/quizzes.
- Use ThemeProvider preset from lessonkit.json.
- course.layout must be "single-spa" for lessonkit package (1.x).
- After edits, list files changed and what to verify in the browser (lessonkit dev).
```

## Workflows

| Goal | Steps |
|------|--------|
| Copy only | Edit text in App.tsx; refresh browser |
| New lesson | Add `<Lesson>` + `lessonkit.json` entry + navigation |
| LMS handoff | User runs `lessonkit build` + `lessonkit package --target scorm12` |

Human reference: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html

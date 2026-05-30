# Vibe coding starter context

Paste once per chat session:

```text
Project: LessonKit 1.0 (Vite + React).
Manifest: lessonkit.json (schemaVersion 1).
Main UI: src/App.tsx.
Blocks: Course, Lesson, Scenario, Quiz, KnowledgeCheck, Reflection, ProgressTracker only.
Rules:
- Keep courseId, lessonId, checkId stable; sync lessonkit.json when adding lessons/quizzes.
- Use ThemeProvider preset from lessonkit.json.
- After edits, list files changed and what to verify in the browser (lessonkit dev).
```

## Workflows

| Goal | Steps |
|------|--------|
| Copy only | Edit text in App.tsx; refresh browser |
| New lesson | Add `<Lesson>` + `lessonkit.json` entry + navigation |
| LMS handoff | User runs `lessonkit build` + `lessonkit package --target scorm12` |

Human reference: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html

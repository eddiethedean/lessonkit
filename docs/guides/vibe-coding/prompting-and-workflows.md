# Prompting and workflows

Good prompts are **specific, bounded, and testable**. Bad prompts are “make it better” without context.

## Starter context block

Paste this once per chat session:

```text
Project: LessonKit 0.8+ (Vite + React).
Manifest: lessonkit.json (schemaVersion 1).
Main UI: src/App.tsx.
Block catalog: @lessonkit/react/block-catalog.v1.json (only use listed block types).
Rules:
- Keep courseId, lessonId, checkId stable; sync lessonkit.json when adding lessons/quizzes.
- Use only block types from the catalog (Course, Lesson, Scenario, Quiz, KnowledgeCheck, Reflection, ProgressTracker).
- Use ThemeProvider with preset from lessonkit.json.
- After edits, tell me which files changed and what to verify in the browser.
```

## Workflow A — content-only iteration

1. `lessonkit dev` running
2. Prompt: change copy, scenarios, or button labels only
3. Refresh browser
4. Repeat

## Workflow B — new lesson

1. Prompt: add lesson + update `lessonkit.json` + navigation
2. Verify in browser
3. Prompt: add quiz with matching `checkId` in JSON and `App.tsx`

## Workflow C — visual refresh

```text
Update src/styles.css for a professional corporate look:
dark blue header, off-white content area, accessible contrast (WCAG AA).
Do not remove semantic HTML or aria labels from App.tsx.
```

## Workflow D — branchy scenario (AI-heavy)

```text
In src/App.tsx, add a simple branching scenario in lesson "inbox-triage":
three fictional emails, learner picks Report / Ignore / Open for each,
show a short summary at the end. Use React useState only; no new npm packages.
Emit no new lessonIds; keep existing lessonId on the Lesson component.
```

## Workflow E — hand off to LMS admin

1. You run `lessonkit build` and `lessonkit package --target scorm12`
2. You send the ZIP from `.lxpack/out/` (path may vary—CLI prints it)
3. Admin uploads to LMS; you do **not** need to explain React

## Prompts to avoid

| Weak prompt | Why |
| --- | --- |
| “Rewrite everything” | Hard to review; breaks IDs |
| “Remove TypeScript errors by using any” | Hides real mistakes |
| “Delete lessonkit.json” | Packaging will fail |
| “Use per-lesson-spa layout” | Not supported by `lessonkit package` (0.9.1) |

## If the AI suggests wrong packages

LessonKit courses typically need only:

- `@lessonkit/react`, `@lessonkit/core`, `react`, `react-dom`
- Dev: `vite`, `@vitejs/plugin-react`, `typescript`

Reject suggestions for Storyline, random UI kits, or state libraries unless you explicitly want them.

## Escalation

When prompts stop working, open the [React developer quickstart](../react-developers/quickstart.md) or ask a developer to review `src/App.tsx` for one session.

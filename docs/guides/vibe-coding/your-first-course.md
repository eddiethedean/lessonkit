# Your first course (without reading React)

Your project has two files the AI should treat as **source of truth**:

| File | What it controls |
| --- | --- |
| `lessonkit.json` | Course title, lesson list, quiz definitions, theme preset, packaging paths |
| `src/App.tsx` | What learners see on screen (text, buttons, lesson flow) |

You rarely edit config files by hand—ask the AI to change them and explain what it did.

## Files you can safely ask the AI to edit

- `src/App.tsx` — lesson content and layout
- `src/styles.css` — colors and spacing (stay readable; contrast matters)
- `lessonkit.json` — when adding/removing lessons or quizzes

## Files to leave alone unless the AI explains why

- `vite.config.ts`, `tsconfig.json`, `package.json` — build tooling
- `index.html` — page shell

## Add a second lesson (prompt)

```text
Add a second lesson to this LessonKit course:
- lessonId: "email-red-flags"
- title: "Red flags in email"
- Update lessonkit.json lessons array and App.tsx so I can navigate between lesson-1 and email-red-flags.
- Use simple Previous/Next buttons at the bottom.
Keep courseId unchanged. Match checkId in lessonkit.json assessments if you add a quiz.
```

Run `lessonkit dev` and click through both lessons.

## Add a quiz (prompt)

```text
Add a Quiz to lesson "email-red-flags":
- checkId: "red-flags-quiz"
- question: "What is the safest first step when an email feels wrong?"
- choices: ["Click the link", "Verify the sender through a known channel"]
- answer: "Verify the sender through a known channel"
Update lessonkit.json assessments with the same checkId and passingScore 1.
```

## Checklist before you call it “done”

- [ ] Course title and lesson titles make sense for your audience
- [ ] Every quiz answer is unambiguously correct in the copy
- [ ] You clicked through all lessons in the browser
- [ ] `lessonkit build` completes without errors (see [Shipping to an LMS](shipping-to-lms.md))

## When the AI changes IDs

LessonKit requires stable IDs for tracking and LMS export:

- `courseId` — one per course
- `lessonId` — one per lesson
- `checkId` — one per quiz/knowledge check

If the AI renames an ID, ask: *“Update lessonkit.json to match and list every ID you changed.”*

Technical details: [Identity reference](../../reference/identity.md).

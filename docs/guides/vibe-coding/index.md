# Vibe coding with LessonKit

:::{admonition} Who this is for
:class: tip

Instructional designers, trainers, and builders who **do not write React by hand**—you’ll pair LessonKit with an AI editor and the CLI.
:::

:::{admonition} Used H5P before?
:class: tip

Ask your AI to follow LessonKit patterns and map activities using **[Coming from H5P?](../h5p-for-lessonkit-authors.md)** (e.g. “use `Quiz` like H5P Multiple Choice”). Capability list: **[H5P capability map](../../project/h5p-capability-map.md)**.
:::

These guides are for **instructional designers, trainers, and builders who do not write React by hand**. You will use an AI assistant in your editor (Cursor, VS Code + Copilot, Windsurf, etc.) and the LessonKit CLI to create and ship courses.

You do not need to understand TypeScript, hooks, or bundlers. You **do** need to:

- Install **Node.js 18+** (required for dev, build, and LMS packaging)
- Follow prompts carefully and paste suggested commands into a terminal
- Review AI-generated changes before publishing

## What “vibe coding” means here

1. **Describe** what you want in plain language (“a 3-lesson phishing course with a quiz at the end”).
2. **Let the AI** edit `src/App.tsx`, `lessonkit.json`, and styles under your direction.
3. **Run** `lessonkit dev` to preview, then `lessonkit build` and `lessonkit package --target scorm12` to export.
4. **Upload** the ZIP (or folder) your LMS admin gives you.

The AI is your implementation partner; LessonKit is the structure it should follow. For repeatable agent behavior, install [Library Skills](../library-skills.md) from the repo (`./library-skills/install.sh --global` or `--project`).

## Guide outline

| Step | Page |
| --- | --- |
| 1 | [Getting started](getting-started.md) — install Node, create a project |
| 2 | [Your first course](your-first-course.md) — edit content without reading React |
| 3 | [Prompting and workflows](prompting-and-workflows.md) — prompts that work well |
| 4 | [Shipping to an LMS](shipping-to-lms.md) — build, package, hand off |
| 5 | [Troubleshooting](troubleshooting.md) — common fixes |
| Optional | [Library Skills](../library-skills.md) — install `SKILL.md` packs for Cursor / Claude Code |

## Golden rules for AI edits

- **Never remove** `courseId`, `lessonId`, or `checkId` from components—the LMS depends on them.
- **Keep** `lessonkit.json` in sync when you add lessons or quizzes (the CLI uses it for packaging).
- **Prefer** small edits: one lesson at a time, then run `lessonkit dev` to verify.
- **Ask the AI** to run terminal commands; you approve them in the terminal.

When you outgrow vibe coding, switch to the [React developer guides](../react-developers/index.md).

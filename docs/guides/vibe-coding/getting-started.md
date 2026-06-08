# Getting started (vibe coding)

## 1. Install Node.js

Download **Node.js 20.19 or newer** from [nodejs.org](https://nodejs.org/) (required for `npx @lessonkit/cli init` with Vite 8).

Check in a terminal:

```bash
node -v
npm -v
```

`node -v` should show **v20.19+** (v22.x is fine). Node 18 may fail during scaffold—see [Prerequisites](../prerequisites.md).

## 2. Create a course project

Open a folder where you want the project (e.g. `Documents/courses`). In the terminal:

```bash
npx @lessonkit/cli init my-phishing-course
cd my-phishing-course
```

`lessonkit init` copies a starter template, writes `lessonkit.json`, and installs dependencies.

## 2.5. Install Library Skills (recommended)

If you use **Cursor**, install LessonKit authoring skills so the AI follows `lessonkit.json` and block contracts — **no full monorepo clone required**:

```bash
curl -fsSL https://raw.githubusercontent.com/eddiethedean/lessonkit/main/library-skills/install-remote.sh | bash -s -- --project -C ~/my-phishing-course
```

Replace `~/my-phishing-course` with your project path. Requires **git** on your PATH (shallow clone of `library-skills/` only).

See [Library Skills](../library-skills.md) for global install, contributors, and other editors.

## 3. Open the project in your AI editor

- **Cursor / VS Code:** File → Open Folder → select `my-phishing-course`
- Tell the AI: *“This is a LessonKit course. Read `lessonkit.json` and `src/App.tsx` before suggesting edits.”*

## 4. Preview locally

```bash
npm run dev
```

(`npx lessonkit dev` works the same way.) Open the URL shown (usually `http://localhost:5173`). Leave this running while you edit.

## 5. First prompt to try

Paste into your AI chat:

```text
I am building a LessonKit course (React + lessonkit.json).
Read lessonkit.json and src/App.tsx.
Change the course title to "Phishing Awareness 101" and add one short paragraph
in the first lesson scenario about spotting suspicious sender addresses.
Do not change courseId, lessonId, or checkId values without updating lessonkit.json.
```

Save files, check the browser, then continue to [Your first course](your-first-course.md).

## Optional: install the CLI globally

```bash
npm install -g @lessonkit/cli
npm run dev
```

Global install is optional; `npx @lessonkit/cli` always works.

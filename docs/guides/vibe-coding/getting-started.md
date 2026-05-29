# Getting started (vibe coding)

## 1. Install Node.js

Download **Node.js 20 LTS** from [nodejs.org](https://nodejs.org/) if you plan to export SCORM packages. Node 18 works for previewing only.

Check in a terminal:

```bash
node -v
npm -v
```

You should see `v18.x` or `v20.x`.

## 2. Create a course project

Open a folder where you want the project (e.g. `Documents/courses`). In the terminal:

```bash
npx @lessonkit/cli init my-phishing-course
cd my-phishing-course
```

`lessonkit init` copies a starter template, writes `lessonkit.json`, and installs dependencies.

## 3. Open the project in your AI editor

- **Cursor / VS Code:** File → Open Folder → select `my-phishing-course`
- Tell the AI: *“This is a LessonKit course. Read `lessonkit.json` and `src/App.tsx` before suggesting edits.”*

## 4. Preview locally

```bash
lessonkit dev
```

Open the URL shown (usually `http://localhost:5173`). Leave this running while you edit.

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
lessonkit dev
```

Global install is optional; `npx @lessonkit/cli` always works.

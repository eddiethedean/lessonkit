# Cybersecurity Awareness

Flagship themed course on Read the Docs — email triage, smishing, and credential hygiene simulations.

## What to look at in `App.tsx`

- Multi-lesson sidebar shell via `_shared/course-ui` (`CourseTopbar`, `SidebarLessons`).
- Dark `ThemeProvider` with noop telemetry/xAPI sinks (swap for production transports).
- `courseId` **`cybersecurity-awareness`** — keep in sync with `lessonkit.json`.

## Run

```bash
npm run build:packages   # from repo root
npm -w lessonkit-example-react-vite run dev
```

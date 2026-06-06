# GDPR Essentials

Compliance-themed course with case files, minimization lab, and incident tabletop.

## What to look at in `App.tsx`

- Same LMS shell pattern as `react-vite` with a light compliance theme preset.
- `courseId` **`data-privacy-essentials`** and lesson routing driven by `LESSONS` metadata.
- Mix of `Scenario`, `Reflection`, and `Quiz` blocks across GDPR topics.

## Run

```bash
npm run build:packages   # from repo root
npm -w lessonkit-example-data-privacy run dev
```

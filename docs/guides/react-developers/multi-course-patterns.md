# Multi-course patterns

How agencies and platform teams organize several LessonKit courses.

## One repo per course (recommended default)

```text
customer-a-phishing/     ← npx @lessonkit/cli init
customer-a-onboarding/
shared-brand-theme/      ← optional npm package
```

**Pros:** Simple CI, isolated semver pins, clear LMS ownership.  
**Cons:** Duplicate boilerplate unless you extract shared UI.

Use `npx @lessonkit/cli init` for each course. Pin `@lessonkit/*` to the same semver across repos when you want aligned behavior.

## Monorepo of courses

```text
courses/
├── phishing-101/
├── onboarding/
└── compliance-q4/
package.json             ← npm workspaces
```

Add each course as an npm workspace. Root scripts:

```json
{
  "scripts": {
    "build:all": "npm run build --workspaces --if-present",
    "package:all": "npm run package:scorm12 --workspaces --if-present"
  }
}
```

**Pros:** Shared components, one lockfile, matrix CI.  
**Cons:** Coupled releases; ID collisions if `courseId` values overlap in telemetry.

## Shared themes

Extract brand tokens to a local package or `@lessonkit/themes` preset:

```typescript
import { mergeThemePreset } from "@lessonkit/themes";
import { brandTheme } from "@your-org/lx-themes";

<ThemeProvider preset={mergeThemePreset("default", brandTheme)} mode="light">
```

Publish internal theme packages to your npm registry; do not copy `--lk-*` CSS across repos by hand.

## Activity IRI strategy

Each course needs a unique xAPI activity IRI in `lessonkit.json`:

```json
"tracking": {
  "xapi": {
    "activityIri": "https://learn.example.com/courses/phishing-101"
  }
}
```

| Pattern | Example |
| --- | --- |
| Per tenant | `https://{tenant}.example.com/courses/{courseId}` |
| Per LMS | `https://lms.example.com/xapi/activities/{courseId}` |
| Global catalog | `https://learn.example.com/catalog/{courseId}` |

Keep IRIs stable across semver bumps unless you intentionally fork reporting.

## Shared components

Extract when **three or more** courses reuse the same block patterns (simulations, chrome, assessment shells). Keep course-specific `App.tsx` and `lessonkit.json` in each course repo.

## CI matrix example (GitHub Actions)

```yaml
strategy:
  matrix:
    course: [phishing-101, onboarding, compliance-q4]
steps:
  - run: npm ci
  - run: npm run build -w ${{ matrix.course }}
  - run: npx lessonkit package --target scorm12 --cwd courses/${{ matrix.course }}
```

## When not to share

- Different LMS targets (SCORM 1.2 vs cmi5 only) — separate packaging config is fine in one repo
- Different bridge allowlists per customer — use env-specific `courseConfig.ts` or build-time env vars
- Experimental blocks — isolate in a pilot course repo until catalog-stable

## Related

- [Project structure](project-structure.md)
- [Deployment guide](deployment-guide.md)
- [First LMS export](first-lms-export.md)

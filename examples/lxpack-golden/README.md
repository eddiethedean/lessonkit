# LXPack golden example

End-to-end reference for `lessonkit build`, `lessonkit package`, and programmatic `@lessonkit/lxpack` packaging.

## `single-spa` manifest vs in-app steps

This course uses `layout: "single-spa"`. The root [`lessonkit.json`](lessonkit.json) lists **one** LMS lesson (`welcome`) because LXPack hosts a single SPA shell.

The React app ([`src/App.tsx`](src/App.tsx)) navigates additional in-SPA steps (`ppe-check`, `hazard-walkthrough`, `safety-check`). Those step ids are **not** separate entries in `lessonkit.json` lessons; only React routing knows them. Assessments (`safety-check`, `ppe-acknowledgment`) are declared in the manifest for LMS scoring.

Keep [`course.descriptor.ts`](course.descriptor.ts) in sync with `lessonkit.json` when using programmatic packaging.

## Commands

```bash
npm run build
npm run package:scorm12
npm run package:standalone
```

Requires Node.js 20+ for packaging targets.

# LXPack golden example

Reference course for `lessonkit build`, `lessonkit package`, and programmatic `@lessonkit/lxpack` usage. Used by CI e2e and conformance tests.

## single-spa layout

`lessonkit.json` lists **one** LMS lesson (`welcome`) — LXPack hosts a single SPA shell.

The React app adds in-SPA steps (`ppe-check`, `hazard-walkthrough`, `safety-signoff`) that exist only in routing, not in the manifest. Assessments (`safety-check`, `ppe-acknowledgment`) are declared for LMS scoring.

Keep [`course.descriptor.ts`](https://github.com/eddiethedean/lessonkit/blob/main/examples/lxpack-golden/course.descriptor.ts) in sync with `lessonkit.json` for programmatic packaging.

## Commands

```bash
npm run build
npm run package:scorm12
npm run package:standalone
```

Node.js **18+** for packaging targets.

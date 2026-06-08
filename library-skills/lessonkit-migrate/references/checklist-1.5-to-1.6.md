# Migration checklist: 1.5.x → 1.6.0

- [ ] Pin aligned `@lessonkit/*` at `^1.6.0` (react, core, cli, xapi, lxpack, themes, accessibility)
- [ ] Run `npm install` and `lessonkit build` — fix TypeScript errors
- [ ] No breaking API changes — existing SCORM/xAPI/cmi5 packaging workflow unchanged
- [ ] Optional: try `lessonkit export` for `.lkcourse` archival handoff
- [ ] Optional: `lessonkit blocks list --json` to inventory runtime blocks
- [ ] `.lkcourse` import restores `lessonkit.json` + `dist/` only — keep React `src/` in git
- [ ] `WordSearch` is page-level only (not nestable in compounds)
- [ ] `lessonkit package --target scorm12` smoke test on Node 20+

Human guide: https://lessonkit.readthedocs.io/en/latest/MIGRATION-1.5-to-1.6.html

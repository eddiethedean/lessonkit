# Migration checklist: 1.6.x → 1.7.0

- [ ] Pin aligned `@lessonkit/*` at `^1.7.0` (react, core, cli, xapi, lxpack, themes, accessibility)
- [ ] Run `npm install` and `lessonkit build` — fix TypeScript errors
- [ ] No breaking API changes — existing SCORM/xAPI/cmi5 packaging workflow unchanged
- [ ] Add `lessonkit.json` descriptors for new scored `checkId`s (`sortParagraphs`, `guessTheAnswer`, `multimediaChoice`, child MCQs in `SingleChoiceSet`)
- [ ] Remember: `sortParagraphs` and scored `guessTheAnswer` are SPA-only in LMS shell
- [ ] `MultimediaChoice` requires `altText` on every choice (including audio)
- [ ] Optional: extend existing `Quiz` descriptors with `answers` for multi-select (LMS shell multi-correct with LXPack **0.7.0+**)
- [ ] Optional: `shuffleChoices` injects into LMS shell with LXPack **0.7.0+**; `shuffleSeed` / per-choice `choiceFeedback` text remain SPA-only
- [ ] `lessonkit package --target scorm12` smoke test on Node 20+

Human guide: https://lessonkit.readthedocs.io/en/latest/MIGRATION-1.6-to-1.7.html

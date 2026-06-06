# LMS compatibility

LessonKit packages courses through **LXPack** (`@lessonkit/lxpack`). Export formats are validated by the monorepo **e2e** and **conformance** harnesses—not by exhaustive testing on every commercial LMS.

## Supported export formats

| Format | CLI `--target` | Validation in repo |
| --- | --- | --- |
| SCORM 1.2 | `scorm12` | Playwright launch + `@lxpack/conformance` |
| SCORM 2004 | `scorm2004` | Playwright `API_1484_11` mock + conformance |
| xAPI | `xapi` | Package build + conformance |
| cmi5 | `cmi5` | Launch spec + conformance |
| Standalone SPA | `standalone` | Vite dist + browser smoke |

See [Export parity](../guides/react-developers/export-parity.md) for the full test matrix.

## LMS runtime requirements

| Requirement | SCORM / xAPI / cmi5 | Standalone |
| --- | --- | --- |
| `config.lxpack.bridge: "auto"` | **Required** for score/completion forwarding | Use `"off"` |
| Parent `lxpackBridge.v1` | Provided by LXPack LMS shell | N/A |
| Modern browser | ES202+ (Vite build) | Same |
| Node.js for packaging | **18+** (authoring machine only) | Same |

If the bridge is missing, the course UI still runs but LMS completion may not update—watch `onLxpackBridgeMiss`. See [LXPack bridge](lxpack-bridge.md).

## Typical LMS behavior

| LMS category | SCORM 1.2 | Notes |
| --- | --- | --- |
| Moodle (mod_scorm) | Widely used | Single-SPA LessonKit export = one SCO; navigation inside iframe |
| Canvas | Supported | Upload ZIP; confirm completion policy matches your assessments |
| Cornerstone / SAP / Workday | Varies | Confirm SCORM 1.2 vs 2004 with your admin; test in staging |
| Internal custom LMS | Test required | Verify `lxpackBridge.v1` or use standalone + xAPI |

:::{admonition} Not a certification
:class: warning

This matrix describes **export format support** and repo test coverage. It is **not** a guarantee for every LMS version or configuration. Always run a staging import before production rollout.
:::

## Known constraints

- **`layout: "single-spa"`** required for `lessonkit package` (1.x). Multi-SCO `per-lesson-spa` needs programmatic `@lessonkit/lxpack` APIs.
- **One Vite build** per package—multi-lesson UX is in-app React navigation.
- **Production telemetry** requires backend proxies or explicit disable—packaged courses run in production mode.
- **xAPI/cmi5** packaging requires HTTPS `activityIri` in `lessonkit.json`.

## Reporting issues

If a package validates in CI but fails in a specific LMS, open a GitHub issue with LMS name/version, `--target`, browser console output, and whether `lxpackBridge` is present in the parent frame.

## Related docs

- [Deployment guide](../guides/react-developers/deployment-guide.md)
- [Packaging reference](packaging.md)
- [Enterprise evaluation](../guides/enterprise-evaluation.md)

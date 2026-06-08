# Plugin marketplace research (1.6.x)

LessonKit **1.6.x** documents preset plugin packs only. A runtime marketplace (dynamic install, version pinning, signing) remains **2.x** scope per [ROADMAP](../ROADMAP.md).

## Current plugin model (0.8.0+)

- Plugins register statically on `LessonkitProvider` via `config.plugins`.
- Kinds: `analytics`, `lms`, `assessment`, `interaction`, `ai`.
- See [plugins reference](../reference/plugins.md) and the [plugin cookbook](react-developers/plugin-cookbook.md).

## 1.6.x preset packs

Authors can bundle **curated plugin arrays** and import them once:

```ts
import { presetAnalyticsPack } from "../_shared/plugins/presetAnalyticsPack";

<LessonkitProvider config={{ plugins: presetAnalyticsPack, ...rest }}>
```

Preset packs are plain TypeScript modules—no registry host, no dynamic `import()`.

## Future marketplace (2.x candidates)

| Concern | Direction |
| --- | --- |
| Discovery | npm scope `@lessonkit/plugins-*` or org registry |
| Security | Signed manifests, allowlisted `interactionBlocks` |
| Versioning | Semver ranges pinned in `lessonkit.json` |
| Blocks split | Optional `@lessonkit/blocks-*` packages feeding catalog JSON |

## Non-goals for 1.6.x

- H5P Hub or third-party widget iframes as plugins
- Runtime download of unsigned plugin code
- Automatic plugin upgrades without author lockfile review

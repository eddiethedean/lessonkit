# @lessonkit/studio-renderer

[![npm](https://img.shields.io/npm/v/@lessonkit/studio-renderer.svg)](https://www.npmjs.com/package/@lessonkit/studio-renderer)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

React renderer for LessonKit Studio `project.json` documents. Maps Studio blocks to [`@lessonkit/react`](https://www.npmjs.com/package/@lessonkit/react) (`Course`, `Lesson`, `Quiz`, `Scenario`) plus presentational primitives.

## Install

```bash
npm install @lessonkit/studio-renderer @lessonkit/studio-schema @lessonkit/react @lessonkit/core @lessonkit/themes react react-dom
```

Studio **0.3.1** on `main` is developed against **@lessonkit/*@1.1.0**. Published `studio-v0.3.x` npm tarballs pin framework at release time.

For the visual editor, see [`@lessonkit/studio-ui`](../studio-ui) and the [Studio editor guide](https://lessonkit.readthedocs.io/en/latest/guides/studio/editor.html).

## Usage

```tsx
import { loadStudioProject } from "@lessonkit/studio-schema";
import { StudioRenderer } from "@lessonkit/studio-renderer";

const loaded = loadStudioProject(projectJson);
if (!loaded.ok) throw new Error("invalid project");

<StudioRenderer project={loaded.project} theme={{ preset: "default", mode: "light" }} />;
```

See [`examples/studio-minimal`](https://github.com/eddiethedean/lessonkit/tree/main/examples/studio-minimal) in the monorepo.

## Docs

[Studio project format v1](https://lessonkit.readthedocs.io/en/latest/guides/studio/project-format-v1.html)

## License

Apache-2.0

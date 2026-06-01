# @lessonkit/studio-schema

[![npm](https://img.shields.io/npm/v/@lessonkit/studio-schema.svg)](https://www.npmjs.com/package/@lessonkit/studio-schema)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

LessonKit Studio **project format v1**: parse, validate, normalize, migrate, and load `project.json` documents.

## Install

```bash
npm install @lessonkit/studio-schema
```

Requires a compatible [`@lessonkit/core`](https://www.npmjs.com/package/@lessonkit/core) release (Studio **0.2.0** is tested with **@lessonkit/core@1.0.2**).

## Usage

```ts
import {
  loadStudioProject,
  validateStudioProject,
  buildStudioBlockCatalog,
} from "@lessonkit/studio-schema";
```

JSON artifacts:

- `@lessonkit/studio-schema/studio-project.v1.json`
- `@lessonkit/studio-schema/studio-block-catalog.v1.json`

## Docs

[Studio project format v1](https://lessonkit.readthedocs.io/en/latest/guides/studio/project-format-v1.html) · [Studio readiness](https://github.com/eddiethedean/lessonkit/blob/main/docs/STUDIO_READINESS.md)

## License

Apache-2.0

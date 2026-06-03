# @lessonkit/studio-ui

React visual editor for LessonKit Studio (`StudioEditor`).

## Install

```bash
npm install @lessonkit/studio-ui @lessonkit/studio-builder @lessonkit/studio-schema @lessonkit/studio-renderer @lessonkit/react @lessonkit/core @lessonkit/themes react react-dom
```

Studio **0.3.1** on `main` is developed against **@lessonkit/*@1.1.0**. Published `studio-v0.3.x` npm tarballs pin framework at release time.

## Usage

```tsx
import { StudioEditor } from "@lessonkit/studio-ui";

<StudioEditor project={project} onProjectChange={setProject} />;
```

The monorepo includes a runnable app: `npm run dev -w lessonkit-studio-web` (see [Studio editor guide](https://lessonkit.readthedocs.io/en/latest/guides/studio/editor.html)).

## License

Apache-2.0

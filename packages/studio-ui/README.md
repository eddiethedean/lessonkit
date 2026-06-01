# @lessonkit/studio-ui

React visual editor for LessonKit Studio (`StudioEditor`).

## Install

```bash
npm install @lessonkit/studio-ui @lessonkit/studio-builder @lessonkit/studio-schema @lessonkit/studio-renderer @lessonkit/react @lessonkit/core @lessonkit/themes react react-dom
```

Studio **0.2.0** is tested with **@lessonkit/*@1.0.2**.

## Usage

```tsx
import { StudioEditor } from "@lessonkit/studio-ui";

<StudioEditor project={project} onProjectChange={setProject} />;
```

The monorepo includes a runnable app: `npm run dev -w lessonkit-studio-web` (see [Studio editor guide](https://lessonkit.readthedocs.io/en/latest/guides/studio/editor.html)).

## License

Apache-2.0

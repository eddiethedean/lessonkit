# @lessonkit/studio-builder

Headless editor state for LessonKit Studio: commands, undo/redo, validation, and autosave hooks.

## Install

```bash
npm install @lessonkit/studio-builder @lessonkit/studio-schema @lessonkit/core
```

Studio **0.2.0** is tested with **@lessonkit/core@1.0.2**.

## Usage

```ts
import { createEditorStore, createDefaultBlock } from "@lessonkit/studio-builder";

const store = createEditorStore(initialProject);
store.getState().dispatch({
  type: "insertBlock",
  pageId: "lesson-1",
  parentPath: [],
  index: 0,
  block: createDefaultBlock("text", store.getState().collectBlockIds()),
});
store.getState().undo();
```

## License

Apache-2.0

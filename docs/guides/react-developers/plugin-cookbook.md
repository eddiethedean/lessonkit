# Plugin cookbook — console analytics

This walkthrough adds a minimal **analytics** plugin to a LessonKit React course. It mirrors
[`examples/_shared/plugins/consoleAnalyticsPlugin.ts`](../../../examples/_shared/plugins/consoleAnalyticsPlugin.ts).

## 1. Define the plugin

```ts
import { defineLessonkitPlugin } from "@lessonkit/react";

export const consoleAnalyticsPlugin = defineLessonkitPlugin({
  id: "example.console-analytics",
  version: "1.0.0",
  kind: "analytics",
  name: "Console analytics",
  setup(ctx) {
    console.info("[plugin] course", ctx.courseId);
  },
  onTelemetry(event) {
    if (event.name === "quiz_completed") {
      console.info("[plugin] quiz_completed", event.data);
    }
    return event;
  },
});
```

## 2. Register on the course

```tsx
import { Course, Lesson, Quiz } from "@lessonkit/react";
import { consoleAnalyticsPlugin } from "./plugins/consoleAnalyticsPlugin";

export default function App() {
  return (
    <Course
      title="Demo"
      courseId="plugin-demo"
      config={{
        plugins: [consoleAnalyticsPlugin],
        tracking: { sink: (e) => console.log("[sink]", e.name) },
      }}
    >
      <Lesson title="Lesson" lessonId="lesson-1">
        <Quiz
          checkId="check-1"
          question="Pick one"
          choices={["A", "B"]}
          answer="B"
        />
      </Lesson>
    </Course>
  );
}
```

## 3. Wrap the tracking sink (optional)

Analytics plugins can decorate the configured sink:

```ts
wrapTrackingSink(sink, ctx) {
  return async (event) => {
    console.info("[wrapped]", ctx.courseId, event.name);
    await sink(event);
  };
},
```

Registration order matters: the **first** plugin in the array is the **innermost** wrapper.

## 4. Filter telemetry

Return `null` from `onTelemetry` to drop an event before it reaches tracking/xAPI:

```ts
onTelemetry(event) {
  if (event.name === "interaction") return null;
  return event;
},
```

## 5. Assessment plugins

Use `kind: "assessment"` and implement `scoreAssessment` when you need custom scoring (open response, rubrics). The host returns the first non-null result from assessment plugins.

## Related

- [Plugins reference](../../reference/plugins.md)
- [Telemetry reference](../../reference/telemetry.md)
- [Export parity](export-parity.md)

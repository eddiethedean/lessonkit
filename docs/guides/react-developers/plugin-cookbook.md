# Plugin cookbook — console analytics

This walkthrough adds a minimal **analytics** plugin to a LessonKit React course. It mirrors
[examples/_shared/plugins/consoleAnalyticsPlugin.ts](https://github.com/eddiethedean/lessonkit/blob/main/examples/_shared/plugins/consoleAnalyticsPlugin.ts).

## 1. Define the plugin

```ts
import { defineTelemetryPlugin } from "@lessonkit/react";

export const consoleAnalyticsPlugin = defineTelemetryPlugin({
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

## 5. Custom scoring with `scoreAssessment`

Use `kind: "assessment"` and implement `scoreAssessment` for open-response or rubric scoring. The host uses the first non-null result from assessment plugins.

### Define the plugin

```ts
import { defineAssessmentPlugin } from "@lessonkit/react";

export const rubricPlugin = defineAssessmentPlugin({
  id: "example.rubric",
  version: "1.0.0",
  kind: "assessment",
  name: "Simple rubric",
  scoreAssessment(ctx) {
    if (ctx.interactionType !== "essay") return null;
    const text = String(ctx.response ?? "");
    const passed = text.trim().length >= 20;
    return {
      score: passed ? 1 : 0,
      maxScore: 1,
      passed,
    };
  },
});
```

### Register and verify telemetry

```tsx
<Course
  courseId="plugin-demo"
  title="Essay demo"
  config={{
    plugins: [rubricPlugin],
    tracking: { sink: (e) => console.log(e.name, e) },
  }}
>
  <Lesson title="Lesson" lessonId="lesson-1">
    <Essay checkId="essay-1" prompt="Describe your incident response plan." />
  </Lesson>
</Course>
```

Complete the essay and confirm `assessment_completed` in the sink with your custom `score` / `maxScore`.

### Test the plugin

```ts
import { describe, expect, it } from "vitest";
import { rubricPlugin } from "./rubricPlugin";

describe("rubricPlugin", () => {
  it("passes long responses", () => {
    const result = rubricPlugin.scoreAssessment?.({
      interactionType: "essay",
      response: "a".repeat(25),
      checkId: "essay-1",
      lessonId: "lesson-1",
      courseId: "plugin-demo",
    } as never);
    expect(result?.passed).toBe(true);
  });
});
```

## Related

- [Plugins reference](../../reference/plugins.md)
- [Telemetry reference](../../reference/telemetry.md)
- [Export parity](export-parity.md)

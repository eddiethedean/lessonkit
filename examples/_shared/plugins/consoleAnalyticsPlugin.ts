import { defineLessonkitPlugin, type LessonkitPlugin } from "@lessonkit/core";

/**
 * Example analytics plugin — logs quiz completions to the console.
 * See docs/guides/react-developers/plugin-cookbook.md
 */
export const consoleAnalyticsPlugin: LessonkitPlugin = defineLessonkitPlugin({
  id: "example.console-analytics",
  version: "1.0.0",
  kind: "analytics",
  name: "Console analytics",
  setup(ctx) {
    console.info("[lessonkit:plugin] setup", ctx.courseId);
  },
  dispose() {
    console.info("[lessonkit:plugin] dispose");
  },
  onTelemetry(event) {
    if (event.name === "quiz_completed") {
      console.info("[lessonkit:plugin:analytics] quiz_completed", event.data);
    }
    return event;
  },
});

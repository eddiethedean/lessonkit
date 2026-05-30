import type { LessonkitConfig } from "../src/context";

/** Minimal provider config for Storybook — telemetry and xAPI disabled. */
export const storyConfig: Omit<LessonkitConfig, "courseId"> = {
  tracking: { enabled: false },
  xapi: { enabled: false },
  lxpack: { bridge: "off" },
};

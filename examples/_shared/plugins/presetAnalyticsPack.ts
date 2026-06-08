import type { LessonkitPlugin } from "@lessonkit/core";
import { consoleAnalyticsPlugin } from "./consoleAnalyticsPlugin";

/** Curated analytics preset for docs and examples (1.6.x marketplace research). */
export const presetAnalyticsPack: LessonkitPlugin[] = [consoleAnalyticsPlugin];

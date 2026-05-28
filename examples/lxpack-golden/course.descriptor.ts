import type { LessonkitCourseDescriptor } from "@lessonkit/lxpack";

/**
 * Golden LXPack course descriptor for CI packaging smoke tests.
 * The React app uses in-app step navigation for the knowledge check; only one
 * lesson row is packaged for single-spa layout.
 */
export const goldenCourseDescriptor: LessonkitCourseDescriptor = {
  courseId: "lxpack-golden",
  title: "LessonKit LXPack Golden Course",
  version: "1.0.0",
  layout: "single-spa",
  spaLessonId: "intro",
  lessons: [{ id: "intro", title: "Introduction" }],
  assessments: [
    {
      checkId: "ready-check",
      question: "Did you complete the intro?",
      choices: ["No", "Yes"],
      answer: "Yes",
      passingScore: 1,
    },
  ],
  theme: { preset: "brand" },
  tracking: { completion: { threshold: 1 } },
};

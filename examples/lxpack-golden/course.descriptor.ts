import type { LessonkitCourseDescriptor } from "@lessonkit/lxpack";

export const goldenCourseDescriptor: LessonkitCourseDescriptor = {
  courseId: "lxpack-golden",
  title: "LessonKit LXPack Golden Course",
  version: "1.0.0",
  layout: "single-spa",
  spaLessonId: "intro",
  lessons: [
    { id: "intro", title: "Introduction" },
    { id: "check", title: "Knowledge check" },
  ],
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

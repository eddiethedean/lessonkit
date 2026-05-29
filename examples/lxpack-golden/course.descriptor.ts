import type { LessonkitCourseDescriptor } from "@lessonkit/lxpack";

export const goldenCourseDescriptor: LessonkitCourseDescriptor = {
  courseId: "workplace-safety-briefing",
  title: "Workplace Safety: Warehouse Briefing",
  version: "1.0.0",
  layout: "single-spa",
  spaLessonId: "welcome",
  lessons: [
    { id: "welcome", title: "Site orientation" },
    { id: "ppe-check", title: "PPE fit & sign-off" },
    { id: "hazard-walkthrough", title: "Floor walk" },
    { id: "safety-check", title: "Sign-off & near-miss" },
  ],
  assessments: [
    {
      checkId: "safety-check",
      question: "You notice an unmarked wet floor near a blind corner. What should you do first?",
      choices: [
        "Walk quickly past before someone else slips",
        "Barricade the area and notify your supervisor",
      ],
      answer: "Barricade the area and notify your supervisor",
      passingScore: 1,
    },
  ],
  theme: { preset: "brand" },
  tracking: { completion: { threshold: 1 } },
};

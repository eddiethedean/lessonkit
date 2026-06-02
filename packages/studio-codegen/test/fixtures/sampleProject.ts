import type { StudioProjectV1 } from "@lessonkit/studio-schema";

export const sampleProject: StudioProjectV1 = {
  schemaVersion: 1,
  course: { courseId: "export-demo", title: "Export demo" },
  pages: [
    {
      id: "lesson-1",
      title: "Lesson one",
      blocks: [
        { type: "heading", id: "h1", level: 2, text: "Welcome" },
        { type: "text", id: "t1", text: "Body copy" },
        {
          type: "quiz",
          id: "q1",
          checkId: "check-1",
          question: "Ready?",
          choices: ["No", "Yes"],
          answer: "Yes",
        },
        {
          type: "container",
          id: "box-1",
          blocks: [
            {
              type: "quiz",
              id: "q2",
              checkId: "check-nested",
              question: "Nested?",
              choices: ["A", "B"],
              answer: "A",
            },
          ],
        },
      ],
    },
    { id: "lesson-2", title: "Lesson two", blocks: [] },
  ],
};

import type { StudioProjectV1 } from "@lessonkit/studio-schema";

export const sampleProject: StudioProjectV1 = {
  schemaVersion: 1,
  course: { courseId: "test-course", title: "Test course" },
  pages: [
    {
      id: "lesson-1",
      title: "Lesson 1",
      blocks: [
        { type: "heading", id: "h1", level: 2, text: "Hello" },
        { type: "text", id: "t1", text: "Body" },
      ],
    },
    {
      id: "lesson-2",
      title: "Lesson 2",
      blocks: [{ type: "container", id: "c1", blocks: [] }],
    },
  ],
};

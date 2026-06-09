import { describe, expect, it } from "vitest";
import { normalizeDescriptor } from "../src/descriptor/normalize";
import type { LessonkitCourseDescriptor } from "../src/types";

describe("normalizeDescriptor 1.7 assessment kinds", () => {
  it("normalizes sortParagraphs without choices", () => {
    const input: LessonkitCourseDescriptor = {
      courseId: "c1",
      title: "Course",
      layout: "single-spa",
      lessons: [{ id: "l1", title: "L1" }],
      assessments: [
        {
          kind: "sortParagraphs",
          checkId: "sort-1",
          question: "Order",
          paragraphs: [" A ", "B"],
          correctOrder: [1, 0],
        },
      ],
    };
    const normalized = normalizeDescriptor(input);
    expect(normalized.assessments?.[0]).toMatchObject({
      kind: "sortParagraphs",
      paragraphs: ["A", "B"],
      correctOrder: [1, 0],
    });
  });
});

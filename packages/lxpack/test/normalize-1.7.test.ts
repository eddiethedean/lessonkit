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

  it("normalizes guessTheAnswer and multimediaChoice", () => {
    const input: LessonkitCourseDescriptor = {
      courseId: "c1",
      title: "Course",
      layout: "single-spa",
      lessons: [{ id: "l1", title: "L1" }],
      assessments: [
        {
          kind: "guessTheAnswer",
          checkId: "guess-1",
          question: "Guess",
          answer: " answer ",
        },
        {
          kind: "multimediaChoice",
          checkId: "mm-1",
          question: "Pick",
          choices: [" Portal ", ""],
          answer: " Portal ",
        },
      ],
    };
    const normalized = normalizeDescriptor(input);
    expect(normalized.assessments?.[0]).toMatchObject({
      kind: "guessTheAnswer",
      answer: "answer",
    });
    expect(normalized.assessments?.[1]).toMatchObject({
      kind: "multimediaChoice",
      choices: ["Portal"],
      answer: "Portal",
    });
  });

  it("normalizes mcq answers array", () => {
    const input: LessonkitCourseDescriptor = {
      courseId: "c1",
      title: "Course",
      layout: "single-spa",
      lessons: [{ id: "l1", title: "L1" }],
      assessments: [
        {
          checkId: "multi-1",
          question: "Select",
          choices: ["A", "B"],
          answer: "A",
          answers: [" A ", "B", ""],
        },
      ],
    };
    const normalized = normalizeDescriptor(input);
    expect(normalized.assessments?.[0]).toMatchObject({
      answers: ["A", "B"],
    });
  });

  it("throws when courseId is invalid", () => {
    expect(() =>
      normalizeDescriptor({
        courseId: "",
        title: "Course",
        layout: "single-spa",
        lessons: [{ id: "l1", title: "L1" }],
      }),
    ).toThrow(/invalid courseId/);
  });
});

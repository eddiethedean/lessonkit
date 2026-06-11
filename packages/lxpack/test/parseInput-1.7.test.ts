import { describe, expect, it } from "vitest";
import { parseAssessmentDescriptor, parseCourseDescriptorInput } from "../src/descriptor/parseInput";

describe("parseAssessmentDescriptor 1.7 fields", () => {
  it("parses mcq variant fields", () => {
    const parsed = parseAssessmentDescriptor({
      checkId: "quiz-1",
      question: "Select",
      choices: ["A", "B"],
      answer: "A",
      answers: ["A", "B"],
      shuffleChoices: true,
      shuffleSeed: 42,
      choiceFeedback: { A: "Good", B: "Also good", bad: 1 },
    });
    expect(parsed).toMatchObject({
      checkId: "quiz-1",
      answers: ["A", "B"],
      shuffleChoices: true,
      shuffleSeed: 42,
      choiceFeedback: { A: "Good", B: "Also good" },
    });
  });

  it("returns empty mcq shell for non-object raw input", () => {
    expect(parseAssessmentDescriptor(null)).toMatchObject({
      checkId: "",
      choices: [],
      answer: "",
    });
  });

  it("parses trueFalse string answers", () => {
    expect(
      parseAssessmentDescriptor({
        kind: "trueFalse",
        checkId: "tf",
        question: "T?",
        answer: "true",
      }),
    ).toMatchObject({ kind: "trueFalse", answer: true });
    expect(
      parseAssessmentDescriptor({
        kind: "trueFalse",
        checkId: "tf2",
        question: "F?",
        answer: "false",
      }),
    ).toMatchObject({ kind: "trueFalse", answer: false });
  });

  it("parses guessTheAnswer and multimediaChoice kinds", () => {
    expect(
      parseAssessmentDescriptor({
        kind: "guessTheAnswer",
        checkId: "g1",
        question: "Guess",
        answer: "secret",
      }),
    ).toMatchObject({ kind: "guessTheAnswer", answer: "secret" });

    expect(
      parseAssessmentDescriptor({
        kind: "multimediaChoice",
        checkId: "mm1",
        question: "Pick",
        choices: ["Portal"],
        answer: "Portal",
      }),
    ).toMatchObject({ kind: "multimediaChoice", choices: ["Portal"] });
  });

  it("parses unknown kind as empty shell assessment", () => {
    const parsed = parseAssessmentDescriptor({
      kind: "essay",
      checkId: "e1",
      question: "Write",
    });
    expect(parsed).toMatchObject({ kind: "essay", choices: [], answer: "" });
  });

  it("parses sortParagraphs kind", () => {
    const parsed = parseAssessmentDescriptor({
      kind: "sortParagraphs",
      checkId: "sort-1",
      question: "Order",
      paragraphs: ["A", "B"],
      correctOrder: [1, 0],
    });
    expect(parsed).toMatchObject({
      kind: "sortParagraphs",
      paragraphs: ["A", "B"],
      correctOrder: [1, 0],
    });
  });
});

describe("parseCourseDescriptorInput mcq variants", () => {
  it("round-trips course with mcq answers in assessments array", () => {
    const parsed = parseCourseDescriptorInput({
      courseId: "c1",
      title: "Course",
      layout: "single-spa",
      lessons: [{ id: "l1", title: "L1" }],
      assessments: [
        {
          checkId: "multi",
          question: "Q",
          choices: ["A", "B"],
          answer: "A",
          answers: ["A", "B"],
        },
      ],
    });
    expect(parsed?.assessments?.[0]).toMatchObject({
      answers: ["A", "B"],
    });
  });
});

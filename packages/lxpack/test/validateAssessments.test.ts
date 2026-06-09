import { describe, expect, it } from "vitest";
import {
  maxAchievableAssessmentScore,
  validateAssessmentEntry,
} from "../src/descriptor/validateAssessments";
import type { AssessmentDescriptor } from "../src/types";
import type { ValidationIssue } from "../src/validationIssue";

describe("maxAchievableAssessmentScore", () => {
  it("returns 1 for mcq and trueFalse", () => {
    expect(
      maxAchievableAssessmentScore({
        checkId: "q1",
        question: "Q?",
        choices: ["a", "b"],
        answer: "a",
      }),
    ).toBe(1);
    expect(
      maxAchievableAssessmentScore({
        kind: "trueFalse",
        checkId: "tf-1",
        question: "Agree?",
        answer: true,
      }),
    ).toBe(1);
  });

  it("counts fillInBlanks blanks from explicit blanks array", () => {
    expect(
      maxAchievableAssessmentScore({
        kind: "fillInBlanks",
        checkId: "fib-1",
        question: "Fill",
        template: "Type *here* and *there*",
        blanks: [
          { id: "b1", answer: "here" },
          { id: "b2", answer: "there" },
        ],
      }),
    ).toBe(2);
  });

  it("counts fillInBlanks blanks from star-delimited template when blanks omitted", () => {
    expect(
      maxAchievableAssessmentScore({
        kind: "fillInBlanks",
        checkId: "fib-2",
        question: "Fill",
        template: "One *a* two *b* three",
      }),
    ).toBe(2);
  });

  it("counts findMultipleHotspots correct targets", () => {
    expect(
      maxAchievableAssessmentScore({
        kind: "findMultipleHotspots",
        checkId: "fmh-1",
        question: "Find hazards",
        src: "/img.png",
        alt: "Scene",
        correctTargetIds: ["a", "b", "c"],
      }),
    ).toBe(3);
  });
});

describe("validateAssessmentEntry", () => {
  const checkIds = new Set<string>();

  function collect(assessment: AssessmentDescriptor, index = 0) {
    const issues: ValidationIssue[] = [];
    validateAssessmentEntry(assessment, index, issues, checkIds);
    return issues;
  }

  it("rejects fillInBlanks blanks length mismatch with template", () => {
    checkIds.clear();
    const issues = collect({
      kind: "fillInBlanks",
      checkId: "fib-mismatch",
      question: "Fill both",
      template: "A *one* B *two*",
      blanks: [{ id: "b1", answer: "one" }],
    });
    expect(issues.some((i) => i.path === "assessments[0].blanks")).toBe(true);
    expect(issues.some((i) => i.message.includes("must match template blank count"))).toBe(true);
  });

  it("rejects passingScore above achievable score for fillInBlanks", () => {
    checkIds.clear();
    const issues = collect({
      kind: "fillInBlanks",
      checkId: "fib-pass",
      question: "Fill both",
      template: "A *one* B *two*",
      passingScore: 3,
    });
    expect(issues.some((i) => i.path === "assessments[0].passingScore")).toBe(true);
    expect(issues.some((i) => i.message.includes("achievable score (2)"))).toBe(true);
  });

  it("requires correctTargetIds for findMultipleHotspots", () => {
    checkIds.clear();
    const issues = collect({
      kind: "findMultipleHotspots",
      checkId: "fmh-missing",
      question: "Find all",
      src: "/img.png",
      alt: "Scene",
      correctTargetIds: [],
    });
    expect(issues.some((i) => i.path === "assessments[0].correctTargetIds")).toBe(true);
  });

  it("requires boolean answer for trueFalse", () => {
    checkIds.clear();
    const issues = collect({
      kind: "trueFalse",
      checkId: "tf-bad",
      question: "Agree?",
      answer: "true" as unknown as boolean,
    });
    expect(issues.some((i) => i.path === "assessments[0].answer")).toBe(true);
  });

  it("rejects omitted answer for trueFalse", () => {
    checkIds.clear();
    const issues = collect({
      kind: "trueFalse",
      checkId: "tf-missing",
      question: "Agree?",
    } as Parameters<typeof collect>[0]);
    expect(issues.some((i) => i.path === "assessments[0].answer")).toBe(true);
  });

  it("rejects duplicate checkId", () => {
    checkIds.clear();
    checkIds.add("dup-check");
    const issues = collect({
      checkId: "dup-check",
      question: "Q?",
      choices: ["a", "b"],
      answer: "a",
    });
    expect(issues.some((i) => i.message === "duplicate checkId")).toBe(true);
  });

  it("validates sortParagraphs correctOrder length", () => {
    checkIds.clear();
    const issues = collect({
      kind: "sortParagraphs",
      checkId: "sort-bad",
      question: "Order",
      paragraphs: ["A", "B"],
      correctOrder: [0],
    });
    expect(issues.some((i) => i.path?.includes("correctOrder"))).toBe(true);
  });

  it("counts sortParagraphs max score from paragraphs", () => {
    expect(
      maxAchievableAssessmentScore({
        kind: "sortParagraphs",
        checkId: "sort-max",
        question: "Order",
        paragraphs: ["A", "B", "C"],
        correctOrder: [2, 0, 1],
      }),
    ).toBe(3);
  });

  it("counts mcq multi-select max score from answers length", () => {
    expect(
      maxAchievableAssessmentScore({
        checkId: "multi-max",
        question: "Select all",
        choices: ["A", "B", "C"],
        answer: "A",
        answers: ["A", "C"],
      }),
    ).toBe(2);
  });

  it("rejects mcq answers not in choices", () => {
    checkIds.clear();
    const issues = collect({
      checkId: "multi-bad",
      question: "Select",
      choices: ["A", "B"],
      answer: "A",
      answers: ["A", "Z"],
    });
    expect(issues.some((i) => i.path?.includes("answers"))).toBe(true);
  });
});

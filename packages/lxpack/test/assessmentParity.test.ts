import { describe, expect, it } from "vitest";
import { descriptorToInterchange } from "../src/interchange";
import { validateLkcourseAssessmentConsistency } from "../src/lkcourse/assessmentParity";
import type { LessonkitCourseDescriptor } from "../src/types";

const injectableDescriptor: LessonkitCourseDescriptor = {
  courseId: "c",
  title: "T",
  layout: "single-spa",
  lessons: [{ id: "l1", title: "L" }],
  assessments: [
    {
      checkId: "ready",
      question: "Ready?",
      choices: ["No", "Yes"],
      answer: "Yes",
    },
  ],
};

describe("validateLkcourseAssessmentConsistency", () => {
  it("accepts matching injectable assessments", () => {
    const interchange = descriptorToInterchange(injectableDescriptor);
    expect(validateLkcourseAssessmentConsistency(injectableDescriptor, interchange)).toEqual([]);
  });

  it("rejects SPA-only assessments in the descriptor", () => {
    const descriptor: LessonkitCourseDescriptor = {
      ...injectableDescriptor,
      assessments: [
        injectableDescriptor.assessments![0]!,
        {
          kind: "fillInBlanks",
          checkId: "fib-1",
          question: "Fill",
          template: "Type *here*",
          blanks: [{ id: "b1", answer: "here" }],
        },
      ],
    };
    const interchange = descriptorToInterchange(injectableDescriptor);
    const issues = validateLkcourseAssessmentConsistency(descriptor, interchange);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.message.includes("fillInBlanks"))).toBe(true);
  });

  it("rejects interchange assessment id drift", () => {
    const interchange = descriptorToInterchange(injectableDescriptor);
    const drifted = {
      ...interchange,
      assessments: interchange.assessments?.map((a) => ({ ...a, id: "other-id" })),
    };
    const issues = validateLkcourseAssessmentConsistency(injectableDescriptor, drifted);
    expect(issues.some((i) => i.path === "interchange.assessments")).toBe(true);
  });

  it("produces stable interchange assessment shape for injectable quiz", () => {
    const interchange = descriptorToInterchange(injectableDescriptor);
    expect(interchange.assessments).toHaveLength(1);
    expect(interchange.assessments![0]).toMatchObject({
      id: "ready",
      passingScore: 1,
      questions: [
        {
          prompt: "Ready?",
          choices: [
            expect.objectContaining({ text: "No", correct: false }),
            expect.objectContaining({ text: "Yes", correct: true }),
          ],
        },
      ],
    });
  });
});

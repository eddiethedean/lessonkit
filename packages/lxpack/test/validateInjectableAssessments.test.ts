import { describe, expect, it } from "vitest";
import type { AssessmentDescriptor } from "../src/types";
import { validateInjectableAssessments } from "../src/descriptor/validateInjectableAssessments";

describe("validateInjectableAssessments", () => {
  it("includes SPA-only guidance for hotspot assessments", () => {
    for (const kind of ["findHotspot", "findMultipleHotspots"] as const) {
      const issues = validateInjectableAssessments({
        courseId: "c",
        title: "T",
        layout: "single-spa",
        lessons: [{ id: "l1", title: "L" }],
        assessments: [
          kind === "findHotspot"
            ? {
                kind: "findHotspot",
                checkId: "hs-1",
                question: "Find",
                src: "/images/map.png",
                alt: "Map",
                correctTargetId: "t1",
              }
            : {
                kind: "findMultipleHotspots",
                checkId: "hs-1",
                question: "Find all",
                src: "/images/map.png",
                alt: "Map",
                correctTargetIds: ["t1"],
              },
        ],
      });
      expect(issues).toHaveLength(1);
      expect(issues[0]!.message).toContain(kind);
      expect(issues[0]!.message).toContain("SPA only");
    }
  });

  it("defaults missing kind to mcq in non-injectable assessment messages", () => {
    const issues = validateInjectableAssessments({
      courseId: "c",
      title: "T",
      layout: "single-spa",
      lessons: [{ id: "l1", title: "L" }],
      assessments: [{ checkId: "orphan", question: "Incomplete" } as AssessmentDescriptor],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain('kind "mcq"');
    expect(issues[0]!.message).not.toContain("SPA only");
  });

  it("omits SPA-only hint for non-injectable kinds outside the SPA-only set", () => {
    const issues = validateInjectableAssessments({
      courseId: "c",
      title: "T",
      layout: "single-spa",
      lessons: [{ id: "l1", title: "L" }],
      assessments: [
        {
          kind: "essay",
          checkId: "essay-1",
          question: "Reflect",
        } as unknown as AssessmentDescriptor,
      ],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain("essay");
    expect(issues[0]!.message).not.toContain("SPA only");
  });

  it("includes SPA-only guidance for fillInBlanks assessments", () => {
    const issues = validateInjectableAssessments({
      courseId: "c",
      title: "T",
      layout: "single-spa",
      lessons: [{ id: "l1", title: "L" }],
      assessments: [
        {
          kind: "fillInBlanks",
          checkId: "fib-1",
          question: "Fill",
          template: "Type *here*",
          blanks: [{ id: "b1", answer: "here" }],
        },
      ],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain("fillInBlanks");
    expect(issues[0]!.message).toContain("SPA only");
  });

  it("includes multi-select MCQ SPA-only guidance", () => {
    const issues = validateInjectableAssessments({
      courseId: "c",
      title: "T",
      layout: "single-spa",
      lessons: [{ id: "l1", title: "L" }],
      assessments: [
        {
          checkId: "multi-1",
          question: "Select all",
          choices: ["A", "B", "C"],
          answer: "A",
          answers: ["A", "C"],
        },
      ],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain("multi-select MCQ");
    expect(issues[0]!.message).toContain("checkId \"multi-1\"");
  });
});

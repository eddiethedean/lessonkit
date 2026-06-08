import { describe, expect, it } from "vitest";
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
          {
            kind,
            checkId: "hs-1",
            question: "Find",
            imageUrl: "https://example.com/img.png",
            hotspots: [{ id: "h1", x: 0.5, y: 0.5, width: 0.1, height: 0.1 }],
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
      assessments: [{ checkId: "orphan", question: "Incomplete" }],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain('kind "mcq"');
    expect(issues[0]!.message).not.toContain("SPA only");
  });

  it("omits SPA-only hint for non-injectable mcq assessments", () => {
    const issues = validateInjectableAssessments({
      courseId: "c",
      title: "T",
      layout: "single-spa",
      lessons: [{ id: "l1", title: "L" }],
      assessments: [
        {
          kind: "dragAndDrop",
          checkId: "dnd-1",
          question: "Drag",
          items: [{ id: "i1", label: "A" }],
          dropZones: [{ id: "z1", label: "Zone" }],
        },
      ],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain("dragAndDrop");
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
});

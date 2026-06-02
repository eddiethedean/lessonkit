import { describe, expect, it } from "vitest";
import { collectQuizAssessments } from "../src/collectQuizzes";
import { sampleProject } from "./fixtures/sampleProject";

describe("collectQuizAssessments", () => {
  it("collects root and nested quizzes", () => {
    const assessments = collectQuizAssessments(sampleProject);
    expect(assessments).toHaveLength(2);
    expect(assessments.map((a) => a.checkId)).toEqual(["check-1", "check-nested"]);
  });

  it("throws on duplicate checkId", () => {
    expect(() =>
      collectQuizAssessments({
        ...sampleProject,
        pages: [
          {
            id: "lesson-1",
            title: "L",
            blocks: [
              {
                type: "quiz",
                id: "a",
                checkId: "dup",
                question: "Q",
                choices: ["A"],
                answer: "A",
              },
              {
                type: "quiz",
                id: "b",
                checkId: "dup",
                question: "Q2",
                choices: ["B"],
                answer: "B",
              },
            ],
          },
        ],
      }),
    ).toThrow(/Duplicate checkId/);
  });
});

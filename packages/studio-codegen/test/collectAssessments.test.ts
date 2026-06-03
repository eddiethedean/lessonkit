import { describe, expect, it } from "vitest";
import { collectAssessments } from "../src/collectQuizzes";
import { sampleProject } from "./fixtures/sampleProject";

describe("collectAssessments", () => {
  it("collects root and nested quizzes", () => {
    const assessments = collectAssessments(sampleProject);
    expect(assessments).toHaveLength(2);
    expect(assessments.map((a) => a.checkId)).toEqual(["check-1", "check-nested"]);
  });

  it("maps assessment block kinds for lxpack", () => {
    const assessments = collectAssessments({
      ...sampleProject,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            {
              type: "trueFalse",
              id: "tf",
              checkId: "check-tf",
              question: "True?",
              answer: false,
            },
            {
              type: "fillInTheBlanks",
              id: "fib",
              checkId: "check-fib",
              template: "The *answer* is here.",
            },
            {
              type: "interactiveBook",
              id: "book",
              blockId: "book-1",
              title: "Book",
              pages: [
                {
                  type: "page",
                  id: "p1",
                  blockId: "page-1",
                  blocks: [
                    {
                      type: "findHotspot",
                      id: "fh",
                      checkId: "check-fh",
                      src: "/map.png",
                      alt: "Map",
                      targets: [{ id: "t1", label: "A", x: 10, y: 20 }],
                      correctTargetId: "t1",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(assessments).toHaveLength(3);
    expect(assessments[0]).toMatchObject({ kind: "trueFalse", checkId: "check-tf" });
    expect(assessments[1]).toMatchObject({ kind: "fillInBlanks", checkId: "check-fib" });
    expect(assessments[2]).toMatchObject({ kind: "findHotspot", checkId: "check-fh" });
  });

  it("throws on duplicate checkId", () => {
    expect(() =>
      collectAssessments({
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
                type: "trueFalse",
                id: "b",
                checkId: "dup",
                question: "Q2",
                answer: true,
              },
            ],
          },
        ],
      }),
    ).toThrow(/Duplicate checkId/);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "./helpers/paths.js";

type ShowcaseExample = {
  dir: string;
  courseId: string;
  checkIds: string[];
};

const SHOWCASES: ShowcaseExample[] = [
  {
    dir: "react-vite",
    courseId: "cybersecurity-awareness",
    checkIds: ["module-assessment-check"],
  },
  {
    dir: "data-privacy",
    courseId: "data-privacy-essentials",
    checkIds: ["privacy-knowledge-check"],
  },
  {
    dir: "customer-service",
    courseId: "customer-de-escalation",
    checkIds: ["de-escalation-check"],
  },
];

describe("showcase manifest parity", () => {
  for (const example of SHOWCASES) {
    describe(example.dir, () => {
      const exampleDir = join(REPO_ROOT, "examples", example.dir);
      const manifest = JSON.parse(readFileSync(join(exampleDir, "lessonkit.json"), "utf8")) as {
        course: { courseId: string; assessments?: Array<{ checkId: string }> };
      };
      const appSource = readFileSync(join(exampleDir, "src/App.tsx"), "utf8");

      it("courseId matches manifest and App.tsx", () => {
        expect(manifest.course.courseId).toBe(example.courseId);
        expect(appSource).toContain(example.courseId);
      });

      it("assessment checkIds appear in App.tsx", () => {
        const manifestChecks = (manifest.course.assessments ?? []).map((a) => a.checkId);
        expect(manifestChecks.sort()).toEqual(example.checkIds.slice().sort());
        for (const checkId of example.checkIds) {
          expect(appSource).toContain(`checkId="${checkId}"`);
        }
      });
    });
  }
});

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "./helpers/paths.js";

type ShowcaseExample = {
  dir: string;
  courseId: string;
  /** When set, only these checkIds are required in source (subset of manifest). */
  checkIds?: string[];
  /** Scan all TSX files under src/ instead of App.tsx only. */
  scanAllSrc?: boolean;
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
  {
    dir: "slide-deck",
    courseId: "slide-deck-demo",
    checkIds: ["ppe-deck-tf"],
  },
  {
    dir: "interactive-book",
    courseId: "interactive-book-demo",
    checkIds: ["ppe-tf"],
  },
  {
    dir: "assessments-p0",
    courseId: "assessments-p0-demo",
  },
  {
    dir: "lxpack-golden",
    courseId: "workplace-safety-briefing",
    checkIds: ["safety-check", "ppe-acknowledgment"],
  },
  {
    dir: "framework-11-showcase",
    courseId: "framework-11-showcase",
    scanAllSrc: true,
  },
  {
    dir: "framework-12-showcase",
    courseId: "framework-12-showcase",
    scanAllSrc: true,
  },
  {
    dir: "interactive-video",
    courseId: "interactive-video-demo",
    checkIds: ["ppe-video-tf"],
  },
  {
    dir: "branching-scenario",
    courseId: "branching-scenario-demo",
    checkIds: ["credit-check"],
  },
];

function readReactSource(exampleDir: string, scanAllSrc: boolean): string {
  if (!scanAllSrc) {
    return readFileSync(join(exampleDir, "src/App.tsx"), "utf8");
  }
  const srcDir = join(exampleDir, "src");
  const parts: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      if (statSync(abs).isDirectory()) walk(abs);
      else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) parts.push(readFileSync(abs, "utf8"));
    }
  };
  walk(srcDir);
  return parts.join("\n");
}

describe("showcase manifest parity", () => {
  for (const example of SHOWCASES) {
    describe(example.dir, () => {
      const exampleDir = join(REPO_ROOT, "examples", example.dir);
      const manifest = JSON.parse(readFileSync(join(exampleDir, "lessonkit.json"), "utf8")) as {
        course: { courseId: string; assessments?: Array<{ checkId: string }> };
      };
      const appSource = readReactSource(exampleDir, Boolean(example.scanAllSrc));

      it("courseId matches manifest and React source", () => {
        expect(manifest.course.courseId).toBe(example.courseId);
        expect(appSource).toContain(example.courseId);
      });

      it("assessment checkIds appear in React source", () => {
        const manifestChecks = (manifest.course.assessments ?? []).map((a) => a.checkId);
        const required = example.checkIds ?? manifestChecks;
        expect(required.every((id) => manifestChecks.includes(id))).toBe(true);
        for (const checkId of required) {
          expect(appSource).toContain(`checkId="${checkId}"`);
        }
      });
    });
  }
});

import { describe, expect, it, vi } from "vitest";
import * as collectQuizzes from "../src/collectQuizzes";
import { loadStudioProject } from "@lessonkit/studio-schema";
import { assertExportableProject } from "../src/validateExport";
import {
  generateExportFiles,
  generateReactViteFiles,
  generateReactViteJsxFiles,
} from "../src/generateReactVite";
import { parseLessonkitManifest } from "@lessonkit/lxpack";
import { sampleProject } from "./fixtures/sampleProject";

describe("generateReactViteFiles", () => {
  it("generates renderer-mode project files", () => {
    const files = generateReactViteFiles(sampleProject);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("package.json");
    expect(paths).toContain("src/project.json");
    expect(paths).toContain("src/main.tsx");
    expect(paths).toContain("lessonkit.json");

    const main = files.find((f) => f.path === "src/main.tsx")!.content;
    expect(main).toContain("StudioRenderer");
    expect(main).not.toContain("App.tsx");

    const manifest = parseLessonkitManifest(
      JSON.parse(files.find((f) => f.path === "lessonkit.json")!.content),
    );
    if (!manifest.ok) {
      throw new Error(JSON.stringify(manifest.issues));
    }
    expect(manifest.manifest.course.lessons).toHaveLength(1);
  });

  it("generates jsx-mode project files", () => {
    const files = generateReactViteJsxFiles(sampleProject, { theme: { preset: "brand" } });
    expect(files.map((f) => f.path)).toContain("src/App.tsx");
    expect(files.find((f) => f.path === "src/App.tsx")!.content).toContain("<Quiz");
    expect(files.find((f) => f.path === "src/main.tsx")!.content).toContain('import App from "./App"');
    expect(files.find((f) => f.path === "package.json")!.content).not.toContain("studio-renderer");
  });

  it("respects exportMode flag", () => {
    const jsx = generateExportFiles(sampleProject, { exportMode: "jsx" });
    expect(jsx.some((f) => f.path === "src/App.tsx")).toBe(true);
    const renderer = generateExportFiles(sampleProject, { exportMode: "renderer" });
    expect(renderer.some((f) => f.path === "src/project.json")).toBe(true);
  });

  it("round-trips project.json through loadStudioProject", () => {
    const files = generateReactViteFiles(sampleProject);
    const raw = JSON.parse(files.find((f) => f.path === "src/project.json")!.content);
    const loaded = loadStudioProject(raw);
    expect(loaded.ok).toBe(true);
  });
});

describe("assertExportableProject", () => {
  it("rejects empty pages", () => {
    const result = assertExportableProject({
      ...sampleProject,
      pages: [],
    });
    expect(result.ok).toBe(false);
  });

  it("accepts valid project", () => {
    expect(assertExportableProject(sampleProject).ok).toBe(true);
  });

  it("rejects invalid schema", () => {
    const result = assertExportableProject({
      ...sampleProject,
      course: { courseId: "", title: "" },
    });
    expect(result.ok).toBe(false);
  });

  it("wraps non-Error throws from quiz collection", () => {
    vi.spyOn(collectQuizzes, "collectQuizAssessments").mockImplementation(() => {
      throw "duplicate quiz";
    });
    const result = assertExportableProject(sampleProject);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.message).toBe("duplicate quiz");
    }
    vi.restoreAllMocks();
  });
});

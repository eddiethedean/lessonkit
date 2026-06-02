import { describe, expect, it } from "vitest";
import { buildLessonkitManifest, defaultActivityIri, studioProjectToDescriptor } from "../src/toDescriptor";
import { sampleProject } from "./fixtures/sampleProject";

describe("studioProjectToDescriptor", () => {
  it("maps primary page to single-spa lesson and quizzes to assessments", () => {
    const descriptor = studioProjectToDescriptor(sampleProject);
    expect(descriptor.lessons).toEqual([{ id: "lesson-1", title: "Lesson one" }]);
    expect(descriptor.assessments).toHaveLength(2);
    expect(descriptor.layout).toBe("single-spa");
    expect(descriptor.spaLessonId).toBe("lesson-1");
  });

  it("uses custom xAPI activity IRI", () => {
    const descriptor = studioProjectToDescriptor(sampleProject, {
      tracking: { xapi: { activityIri: "https://example.com/course" } },
    });
    expect(descriptor.tracking?.xapi?.activityIri).toBe("https://example.com/course");
  });

  it("includes completion threshold when provided", () => {
    const descriptor = studioProjectToDescriptor(sampleProject, {
      tracking: { completion: { threshold: 0.8 } },
    });
    expect(descriptor.tracking?.completion?.threshold).toBe(0.8);
  });

  it("builds lessonkit manifest with paths", () => {
    const manifest = buildLessonkitManifest(sampleProject, {
      theme: { preset: "brand" },
      paths: { spaDistDir: "build", lxpackOutDir: "lx", outputBaseDir: "out" },
    });
    expect(manifest.name).toBe("export-demo");
    expect(manifest.course.theme?.preset).toBe("brand");
    expect(manifest.paths.spaDistDir).toBe("build");
  });

  it("defaultActivityIri derives from courseId", () => {
    expect(defaultActivityIri("my-course")).toBe("https://lessonkit.app/courses/my-course");
  });

  it("throws when project has no pages", () => {
    expect(() =>
      studioProjectToDescriptor({ ...sampleProject, pages: [] }),
    ).toThrow(/at least one page/);
  });
});

import type { LessonkitCourseDescriptor } from "./types";
import { validateDescriptor } from "./validateDescriptor";
import { validateProjectPaths } from "./validateProjectPaths";

export type LessonkitManifestPaths = {
  spaDistDir: string;
  lxpackOutDir: string;
  outputBaseDir: string;
};

export type LessonkitManifest = {
  schemaVersion: 1;
  name: string;
  course: LessonkitCourseDescriptor;
  paths: LessonkitManifestPaths;
};

export type ManifestParseIssue = { path: string; message: string };

export type ParseManifestResult =
  | { ok: true; manifest: LessonkitManifest }
  | { ok: false; issues: ManifestParseIssue[] };

const DEFAULT_PATHS: LessonkitManifestPaths = {
  spaDistDir: "dist",
  lxpackOutDir: ".lxpack/course",
  outputBaseDir: ".lxpack/out",
};

export function parseLessonkitManifest(
  raw: unknown,
  label = "lessonkit.json",
  projectRoot?: string,
): ParseManifestResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, issues: [{ path: label, message: "must be a JSON object" }] };
  }

  const config = raw as Record<string, unknown>;
  const issues: ManifestParseIssue[] = [];

  if (config.schemaVersion !== 1) {
    issues.push({
      path: "schemaVersion",
      message: `must be 1 (got ${String(config.schemaVersion)})`,
    });
  }

  const name = config.name;
  if (typeof name !== "string" || !name.trim()) {
    issues.push({ path: "name", message: "must be a non-empty string" });
  }

  const courseRaw = config.course;
  if (Array.isArray(courseRaw)) {
    issues.push({ path: "course", message: "must be an object, not an array" });
    return { ok: false, issues };
  }
  if (!courseRaw || typeof courseRaw !== "object") {
    issues.push({ path: "course", message: "must be an object" });
    return { ok: false, issues };
  }

  const courseObj = courseRaw as Record<string, unknown>;
  if (courseObj.lessons !== undefined && !Array.isArray(courseObj.lessons)) {
    issues.push({ path: "course.lessons", message: "must be an array" });
  }
  if (courseObj.assessments !== undefined && !Array.isArray(courseObj.assessments)) {
    issues.push({ path: "course.assessments", message: "must be an array" });
  }

  if (issues.length) return { ok: false, issues };

  const validation = validateDescriptor(courseRaw as LessonkitCourseDescriptor);
  if (!validation.ok) {
    for (const i of validation.issues) {
      issues.push({
        path: i.path.startsWith("course.") ? i.path : `course.${i.path}`,
        message: i.message,
      });
    }
  } else if (validation.descriptor.layout === "per-lesson-spa") {
    issues.push({
      path: "course.layout",
      message:
        "per-lesson-spa is not supported by lessonkit package yet. Use single-spa or package via @lessonkit/lxpack directly.",
    });
  }

  const paths: LessonkitManifestPaths = { ...DEFAULT_PATHS };
  const pathsRaw = config.paths;
  if (pathsRaw !== undefined && (typeof pathsRaw !== "object" || pathsRaw === null)) {
    issues.push({ path: "paths", message: "must be an object" });
  } else if (pathsRaw && typeof pathsRaw === "object") {
    const p = pathsRaw as Record<string, unknown>;
    for (const key of ["spaDistDir", "lxpackOutDir", "outputBaseDir"] as const) {
      if (p[key] !== undefined) {
        if (typeof p[key] !== "string" || !(p[key] as string).trim()) {
          issues.push({ path: `paths.${key}`, message: "must be a non-empty string" });
        } else {
          paths[key] = (p[key] as string).trim();
        }
      }
    }
  }

  const courseSpaDistDir =
    validation.ok ? validation.descriptor.spaDistDir?.trim() : undefined;
  if (courseSpaDistDir && courseSpaDistDir !== paths.spaDistDir) {
    issues.push({
      path: "course.spaDistDir",
      message: `"course.spaDistDir" (${courseSpaDistDir}) differs from "paths.spaDistDir" (${paths.spaDistDir}). Use paths.spaDistDir for CLI build and package.`,
    });
  }

  if (projectRoot) {
    const pathIssues = validateProjectPaths(projectRoot, paths);
    for (const pi of pathIssues) {
      issues.push({ path: pi.path, message: pi.message });
    }
  }

  if (issues.length) return { ok: false, issues };

  if (!validation.ok) return { ok: false, issues };

  return {
    ok: true,
    manifest: {
      schemaVersion: 1,
      name: name as string,
      course: validation.descriptor,
      paths,
    },
  };
}

export async function loadLessonkitManifestFromFile(
  readJson: () => Promise<unknown>,
  label = "lessonkit.json",
  projectRoot?: string,
): Promise<ParseManifestResult> {
  try {
    return parseLessonkitManifest(await readJson(), label, projectRoot);
  } catch {
    return { ok: false, issues: [{ path: label, message: "failed to read or parse JSON" }] };
  }
}

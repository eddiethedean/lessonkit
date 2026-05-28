import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { packageLessonkitCourse, type ExportTarget } from "@lessonkit/lxpack";
import { goldenCourseDescriptor } from "../course.descriptor";

const target = (process.argv[2] ?? "scorm12") as ExportTarget;
const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, "..");
const outDir = resolve(exampleRoot, ".lxpack/course");
const distDir = resolve(exampleRoot, "dist");

const isDir = target === "standalone";
const output = isDir ? `.lxpack/out/${target}` : `.lxpack/out/course-${target}.zip`;

const result = await packageLessonkitCourse({
  descriptor: goldenCourseDescriptor,
  outDir,
  spaDistDir: distDir,
  target,
  output,
  dir: isDir,
});

if (!result.ok) {
  console.error("[package] failed", result.issues);
  process.exit(1);
}

console.log("[package] ok", {
  target: result.target,
  outputPath: result.outputPath,
  outputDir: result.outputDir,
  fileCount: result.fileCount,
});

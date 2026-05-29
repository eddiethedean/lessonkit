import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { packageLessonkitCourse } from "@lessonkit/lxpack";
import { goldenCourseDescriptor } from "../examples/lxpack-golden/course.descriptor";
import {
  ARTIFACTS_DIR,
  ARTIFACTS_MANIFEST,
  GOLDEN_DIR,
  REPO_ROOT,
  TELEMETRY_HARNESS_DIR,
} from "./support/paths";
import { resolveScorm12LaunchPath, unpackScormZip } from "./support/scorm/unpack";

function ensurePackagesBuilt(): void {
  execSync("npm run build:packages", { cwd: REPO_ROOT, stdio: "inherit" });
}

function ensureGoldenDist(): string {
  const distDir = join(GOLDEN_DIR, "dist");
  if (!existsSync(join(distDir, "index.html"))) {
    console.log("e2e: building golden dist…");
    ensurePackagesBuilt();
    execSync("npm run build -w lessonkit-example-lxpack-golden", {
      cwd: REPO_ROOT,
      stdio: "inherit",
    });
  }
  return distDir;
}

function ensureTelemetryHarnessDist(): string {
  const distDir = join(TELEMETRY_HARNESS_DIR, "dist");
  if (!existsSync(join(distDir, "index.html"))) {
    console.log("e2e: building telemetry harness…");
    ensurePackagesBuilt();
    execSync("npm run build -w lessonkit-e2e-telemetry-harness", {
      cwd: REPO_ROOT,
      stdio: "inherit",
    });
  }
  return distDir;
}

async function globalSetup(): Promise<void> {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });

  const goldenDistDir = ensureGoldenDist();
  const telemetryHarnessDistDir = ensureTelemetryHarnessDist();

  if (!process.env.E2E_FORCE_REBUILD && existsSync(ARTIFACTS_MANIFEST)) {
    console.log("e2e: reusing existing LXPack artifacts (set E2E_FORCE_REBUILD=1 to rebuild)");
    const existing = JSON.parse(readFileSync(ARTIFACTS_MANIFEST, "utf8")) as {
      telemetryHarnessDistDir?: string;
    };
    if (existing.telemetryHarnessDistDir) {
      return;
    }
  }

  console.log("e2e: packaging golden artifacts…");
  const courseOutDir = join(ARTIFACTS_DIR, "lxpack-course");
  const scormCourseOutDir = join(ARTIFACTS_DIR, "lxpack-course-scorm");
  const scorm12UnpackedDir = join(ARTIFACTS_DIR, "scorm12-unpacked");

  const standaloneResult = await packageLessonkitCourse({
    descriptor: goldenCourseDescriptor,
    outDir: courseOutDir,
    spaDistDir: goldenDistDir,
    target: "standalone",
    output: ".lxpack/out/standalone",
    dir: true,
    outputBaseDir: ".lxpack/out",
  });
  if (!standaloneResult.ok) {
    throw new Error(
      `standalone package failed: ${JSON.stringify(standaloneResult.issues, null, 2)}`,
    );
  }

  const scormResult = await packageLessonkitCourse({
    descriptor: goldenCourseDescriptor,
    outDir: scormCourseOutDir,
    spaDistDir: goldenDistDir,
    target: "scorm12",
    output: ".lxpack/out/course-scorm12.zip",
    outputBaseDir: ".lxpack/out",
  });
  if (!scormResult.ok) {
    throw new Error(`scorm12 package failed: ${JSON.stringify(scormResult.issues, null, 2)}`);
  }

  const scorm12Zip =
    scormResult.outputPath ?? join(scormCourseOutDir, ".lxpack/out/course-scorm12.zip");

  await unpackScormZip(scorm12Zip, scorm12UnpackedDir);
  const launchPath = resolveScorm12LaunchPath(scorm12UnpackedDir);

  const manifest = {
    goldenDistDir,
    telemetryHarnessDistDir,
    standaloneDir:
      standaloneResult.outputDir ?? join(courseOutDir, ".lxpack/out/standalone"),
    scorm12Zip,
    scorm12UnpackedDir,
    scorm12LaunchUrl: `file://${launchPath}`,
  };

  writeFileSync(ARTIFACTS_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log("e2e artifacts prepared:", manifest);
}

export default globalSetup;

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

function manifestIsComplete(existing: Record<string, unknown>): boolean {
  return Boolean(
    existing.telemetryHarnessDistDir &&
      existing.scorm2004UnpackedDir &&
      existing.xapiUnpackedDir &&
      existing.cmi5UnpackedDir,
  );
}

async function globalSetup(): Promise<void> {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });

  const goldenDistDir = ensureGoldenDist();
  const telemetryHarnessDistDir = ensureTelemetryHarnessDist();

  if (!process.env.E2E_FORCE_REBUILD && existsSync(ARTIFACTS_MANIFEST)) {
    console.log("e2e: reusing existing LXPack artifacts (set E2E_FORCE_REBUILD=1 to rebuild)");
    const existing = JSON.parse(readFileSync(ARTIFACTS_MANIFEST, "utf8")) as Record<string, unknown>;
    if (manifestIsComplete(existing)) {
      return;
    }
  }

  console.log("e2e: packaging golden artifacts…");
  const courseOutDir = join(ARTIFACTS_DIR, "lxpack-course");
  const scormCourseOutDir = join(ARTIFACTS_DIR, "lxpack-course-scorm");
  const scorm12UnpackedDir = join(ARTIFACTS_DIR, "scorm12-unpacked");
  const scorm2004UnpackedDir = join(ARTIFACTS_DIR, "scorm2004-unpacked");
  const xapiUnpackedDir = join(ARTIFACTS_DIR, "xapi-unpacked");
  const cmi5UnpackedDir = join(ARTIFACTS_DIR, "cmi5-unpacked");

  const standaloneResult = await packageLessonkitCourse({
    descriptor: goldenCourseDescriptor,
    outDir: courseOutDir,
    spaDistDir: goldenDistDir,
    projectRoot: GOLDEN_DIR,
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

  async function packageZip(
    target: "scorm12" | "scorm2004" | "xapi" | "cmi5",
    outDir: string,
  ): Promise<string> {
    const result = await packageLessonkitCourse({
      descriptor: goldenCourseDescriptor,
      outDir,
      spaDistDir: goldenDistDir,
      projectRoot: GOLDEN_DIR,
      target,
      output: `.lxpack/out/course-${target}.zip`,
      outputBaseDir: ".lxpack/out",
    });
    if (!result.ok) {
      throw new Error(`${target} package failed: ${JSON.stringify(result.issues, null, 2)}`);
    }
    return result.outputPath ?? join(outDir, `.lxpack/out/course-${target}.zip`);
  }

  const scorm12Zip = await packageZip("scorm12", scormCourseOutDir);
  const scorm2004Zip = await packageZip("scorm2004", join(ARTIFACTS_DIR, "lxpack-course-scorm2004"));
  const xapiZip = await packageZip("xapi", join(ARTIFACTS_DIR, "lxpack-course-xapi"));
  const cmi5Zip = await packageZip("cmi5", join(ARTIFACTS_DIR, "lxpack-course-cmi5"));

  await unpackScormZip(scorm12Zip, scorm12UnpackedDir);
  await unpackScormZip(scorm2004Zip, scorm2004UnpackedDir);
  await unpackScormZip(xapiZip, xapiUnpackedDir);
  await unpackScormZip(cmi5Zip, cmi5UnpackedDir);

  const scorm12LaunchPath = resolveScorm12LaunchPath(scorm12UnpackedDir);
  const scorm2004LaunchPath = resolveScorm12LaunchPath(scorm2004UnpackedDir);

  const manifest = {
    goldenDistDir,
    telemetryHarnessDistDir,
    standaloneDir:
      standaloneResult.outputDir ?? join(courseOutDir, ".lxpack/out/standalone"),
    scorm12Zip,
    scorm12UnpackedDir,
    scorm12LaunchUrl: `file://${scorm12LaunchPath}`,
    scorm2004Zip,
    scorm2004UnpackedDir,
    scorm2004LaunchUrl: `file://${scorm2004LaunchPath}`,
    xapiZip,
    xapiUnpackedDir,
    cmi5Zip,
    cmi5UnpackedDir,
  };

  writeFileSync(ARTIFACTS_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log("e2e artifacts prepared:", manifest);
}

export default globalSetup;

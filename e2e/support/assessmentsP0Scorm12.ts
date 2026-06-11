import { execSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ARTIFACTS_DIR, ASSESSMENTS_P0_DIR, CLI_BIN, REPO_ROOT } from "./paths";
import { resolveScorm12LaunchPath, unpackScormZip } from "./scorm/unpack";

export const ASSESSMENTS_P0_SCORM12_ZIP = join(
  ASSESSMENTS_P0_DIR,
  ".lxpack/course/.lxpack/out/course-scorm12.zip",
);
export const ASSESSMENTS_P0_SCORM12_UNPACKED = join(
  ARTIFACTS_DIR,
  "assessments-p0-scorm12-unpacked",
);

const ASSESSMENTS_P0_DIST_INDEX = join(ASSESSMENTS_P0_DIR, "dist/index.html");

function forceRebuild(): boolean {
  return process.env.E2E_FORCE_REBUILD === "1";
}

function cliIsBuilt(): boolean {
  return existsSync(CLI_BIN);
}

function zipNeedsRebuild(): boolean {
  if (forceRebuild() || !existsSync(ASSESSMENTS_P0_SCORM12_ZIP)) return true;
  if (!existsSync(ASSESSMENTS_P0_DIST_INDEX)) return true;
  return (
    statSync(ASSESSMENTS_P0_DIST_INDEX).mtimeMs > statSync(ASSESSMENTS_P0_SCORM12_ZIP).mtimeMs
  );
}

function unpackNeedsRefresh(): boolean {
  const manifestPath = join(ASSESSMENTS_P0_SCORM12_UNPACKED, "imsmanifest.xml");
  if (forceRebuild() || !existsSync(manifestPath)) return true;
  if (!existsSync(ASSESSMENTS_P0_SCORM12_ZIP)) return true;
  return statSync(ASSESSMENTS_P0_SCORM12_ZIP).mtimeMs > statSync(manifestPath).mtimeMs;
}

function ensurePackagesAndCliBuilt(): void {
  if (cliIsBuilt() && !forceRebuild()) return;
  execSync("npm run build:packages && npm run -w @lessonkit/cli build", {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
}

function ensureAssessmentsP0DistBuilt(): void {
  if (!forceRebuild() && existsSync(ASSESSMENTS_P0_DIST_INDEX)) return;
  execSync("npm run build -w lessonkit-example-assessments-p0", {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
}

function packageAssessmentsP0Scorm12(): void {
  execSync(`node ${CLI_BIN} package --target scorm12 --no-build`, {
    cwd: ASSESSMENTS_P0_DIR,
    stdio: "inherit",
  });
  if (!existsSync(ASSESSMENTS_P0_SCORM12_ZIP)) {
    throw new Error(`Missing SCORM 1.2 zip at ${ASSESSMENTS_P0_SCORM12_ZIP}`);
  }
}

/**
 * Build, package, and unpack assessments-p0 SCORM 1.2 artifacts when missing or stale.
 * Skips redundant monorepo rebuilds when the CLI is already built and only repackages when dist changes.
 */
export async function ensureAssessmentsP0Scorm12Artifacts(): Promise<void> {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });

  if (zipNeedsRebuild()) {
    ensurePackagesAndCliBuilt();
    ensureAssessmentsP0DistBuilt();
    packageAssessmentsP0Scorm12();
  }

  if (unpackNeedsRefresh()) {
    await unpackScormZip(ASSESSMENTS_P0_SCORM12_ZIP, ASSESSMENTS_P0_SCORM12_UNPACKED);
  }

  resolveScorm12LaunchPath(ASSESSMENTS_P0_SCORM12_UNPACKED);
}

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const E2E_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const REPO_ROOT = join(E2E_ROOT, "..");
export const GOLDEN_DIR = join(REPO_ROOT, "examples/lxpack-golden");
export const TELEMETRY_HARNESS_DIR = join(E2E_ROOT, "fixtures/telemetry-harness");
export const ARTIFACTS_DIR = join(E2E_ROOT, ".artifacts");
export const ARTIFACTS_MANIFEST = join(ARTIFACTS_DIR, "manifest.json");

export type ArtifactsManifest = {
  goldenDistDir: string;
  telemetryHarnessDistDir: string;
  standaloneDir: string;
  scorm12Zip: string;
  scorm12UnpackedDir: string;
  scorm12LaunchUrl: string;
};

export function readArtifactsManifest(): ArtifactsManifest {
  if (!existsSync(ARTIFACTS_MANIFEST)) {
    throw new Error(
      `Missing ${ARTIFACTS_MANIFEST}. Run Playwright global setup or npm run test:e2e first.`,
    );
  }
  return JSON.parse(readFileSync(ARTIFACTS_MANIFEST, "utf8")) as ArtifactsManifest;
}

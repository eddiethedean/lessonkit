import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const INTEGRATION_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const REPO_ROOT = join(INTEGRATION_ROOT, "..");
export const CLI_BIN = join(REPO_ROOT, "packages/cli/dist/bin.js");
export const GOLDEN_DIR = join(REPO_ROOT, "examples/lxpack-golden");
export const ASSESSMENTS_P0_DIR = join(REPO_ROOT, "examples/assessments-p0");
export const INTERACTIVE_BOOK_DIR = join(REPO_ROOT, "examples/interactive-book");
export const SLIDE_DECK_DIR = join(REPO_ROOT, "examples/slide-deck");
export const INTERACTIVE_VIDEO_DIR = join(REPO_ROOT, "examples/interactive-video");
export const BRANCHING_SCENARIO_DIR = join(REPO_ROOT, "examples/branching-scenario");
export const FRAMEWORK_12_SHOWCASE_DIR = join(REPO_ROOT, "examples/framework-12-showcase");
export const MINIMAL_FIXTURE_DIR = join(INTEGRATION_ROOT, "fixtures/minimal-course");

export const LESSONKIT_PACKAGES = [
  "@lessonkit/core",
  "@lessonkit/xapi",
  "@lessonkit/accessibility",
  "@lessonkit/themes",
  "@lessonkit/lxpack",
  "@lessonkit/react",
  "@lessonkit/cli",
] as const;

export function packageDir(name: string): string {
  const dir = name.replace("@lessonkit/", "");
  return join(REPO_ROOT, "packages", dir);
}

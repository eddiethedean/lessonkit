import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  CLI_BIN,
  MINIMAL_FIXTURE_DIR,
  REPO_ROOT,
  SHARED_MINIMAL_FIXTURE_DIR,
} from "./test/helpers/paths.js";
import {
  installProjectDeps,
  patchPackageJsonForMonorepo,
} from "./test/helpers/tempProject.js";

const EXAMPLE_BUILDS = [
  ["lessonkit-example-lxpack-golden", "examples/lxpack-golden/dist/index.html"],
  ["lessonkit-example-assessments-p0", "examples/assessments-p0/dist/index.html"],
  ["lessonkit-example-interactive-book", "examples/interactive-book/dist/index.html"],
  ["lessonkit-example-slide-deck", "examples/slide-deck/dist/index.html"],
  ["lessonkit-example-interactive-video", "examples/interactive-video/dist/index.html"],
  ["lessonkit-example-branching-scenario", "examples/branching-scenario/dist/index.html"],
  ["lessonkit-example-framework-12-showcase", "examples/framework-12-showcase/dist/index.html"],
] as const;

export default async function globalSetup(): Promise<void> {
  if (!existsSync(CLI_BIN) || process.env.LK_INTEGRATION_FORCE_SETUP === "1") {
    execSync("npm run build:packages", { cwd: REPO_ROOT, stdio: "inherit" });
    execSync("npm run -w @lessonkit/cli build", { cwd: REPO_ROOT, stdio: "inherit" });
  }
  process.env.LK_INTEGRATION_PACKAGES_BUILT = "1";

  if (!existsSync(join(SHARED_MINIMAL_FIXTURE_DIR, "node_modules"))) {
    await mkdir(SHARED_MINIMAL_FIXTURE_DIR, { recursive: true });
    await cp(MINIMAL_FIXTURE_DIR, SHARED_MINIMAL_FIXTURE_DIR, { recursive: true });
    await patchPackageJsonForMonorepo(join(SHARED_MINIMAL_FIXTURE_DIR, "package.json"));
    await installProjectDeps(SHARED_MINIMAL_FIXTURE_DIR);
  }

  await Promise.all(
    EXAMPLE_BUILDS.map(async ([workspace, distMarker]) => {
      if (existsSync(join(REPO_ROOT, distMarker))) return;
      execSync(`npm run build -w ${workspace}`, { cwd: REPO_ROOT, stdio: "inherit" });
    }),
  );
}

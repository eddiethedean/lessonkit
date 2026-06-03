import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, test } from "@playwright/test";
import type { Server } from "node:http";
import { completeAssessmentsP0ScormShell } from "../../fixtures/assessments-p0-flow";
import { ARTIFACTS_DIR, ASSESSMENTS_P0_DIR, CLI_BIN, REPO_ROOT } from "../../support/paths";
import { injectScorm12Api, readScorm12State } from "../../support/scorm/inject";
import { resolveScorm12LaunchPath, unpackScormZip } from "../../support/scorm/unpack";
import { startStaticServer, stopServer } from "../../support/standalone-server";

const SCORM12_UNPACKED = join(ARTIFACTS_DIR, "assessments-p0-scorm12-unpacked");

test.describe("assessments-p0 scorm12 LMS", () => {
  let server: Server;
  let baseUrl: string;

  test.beforeAll(async () => {
    mkdirSync(ARTIFACTS_DIR, { recursive: true });
    execSync("npm run build:packages && npm run -w @lessonkit/cli build", {
      cwd: REPO_ROOT,
      stdio: "inherit",
    });
    execSync("npm run build -w lessonkit-example-assessments-p0", {
      cwd: REPO_ROOT,
      stdio: "inherit",
    });
    execSync(`node ${CLI_BIN} package --target scorm12 --no-build`, {
      cwd: ASSESSMENTS_P0_DIR,
      stdio: "inherit",
    });
    const zipPath = join(
      ASSESSMENTS_P0_DIR,
      ".lxpack/course/.lxpack/out/course-scorm12.zip",
    );
    if (!existsSync(zipPath)) {
      throw new Error(`Missing SCORM 1.2 zip at ${zipPath}`);
    }
    await unpackScormZip(zipPath, SCORM12_UNPACKED);
    const launchPath = resolveScorm12LaunchPath(SCORM12_UNPACKED);
    const launchHref = relative(SCORM12_UNPACKED, launchPath).split("\\").join("/");
    server = await startStaticServer(SCORM12_UNPACKED, 4178);
    baseUrl = `http://127.0.0.1:4178/${launchHref}`;
  });

  test.afterAll(async () => {
    await stopServer(server);
  });

  test("launch with API mock and record completion", async ({ page }) => {
    await injectScorm12Api(page);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await completeAssessmentsP0ScormShell(page);

    const state = await readScorm12State(page);
    const status = state.store["cmi.core.lesson_status"] ?? "";
    const completed =
      status === "completed" ||
      status === "passed" ||
      state.log.some(
        (e) =>
          e.element.includes("lesson_status") &&
          (e.value === "completed" || e.value === "passed"),
      ) ||
      state.log.some((e) => e.element.includes("score"));

    expect(completed).toBe(true);
  });
});

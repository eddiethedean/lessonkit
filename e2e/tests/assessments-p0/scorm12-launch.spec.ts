import { relative } from "node:path";
import { expect, test } from "@playwright/test";
import type { Server } from "node:http";
import { completeAssessmentsP0ScormShell } from "../../fixtures/assessments-p0-flow";
import {
  ASSESSMENTS_P0_SCORM12_UNPACKED,
  ensureAssessmentsP0Scorm12Artifacts,
} from "../../support/assessmentsP0Scorm12";
import { injectScorm12Api, readScorm12State } from "../../support/scorm/inject";
import { resolveScorm12LaunchPath } from "../../support/scorm/unpack";
import { startStaticServer, stopServer } from "../../support/standalone-server";

test.describe("assessments-p0 scorm12 LMS", () => {
  test.describe.configure({ timeout: 180_000 });

  let server: Server;
  let baseUrl: string;

  test.beforeAll(async () => {
    await ensureAssessmentsP0Scorm12Artifacts();
    const launchPath = resolveScorm12LaunchPath(ASSESSMENTS_P0_SCORM12_UNPACKED);
    const launchHref = relative(ASSESSMENTS_P0_SCORM12_UNPACKED, launchPath).split("\\").join("/");
    server = await startStaticServer(ASSESSMENTS_P0_SCORM12_UNPACKED, 4178);
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
      );

    expect(completed).toBe(true);
  });
});

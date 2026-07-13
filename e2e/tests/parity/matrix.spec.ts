import { expect, test } from "@playwright/test";
import type { Server } from "node:http";
import {
  completePackagedAssessments,
  expectPackagedAssessmentPassed,
  runViteGoldenFlow,
} from "../../fixtures/golden-flow";
import { readArtifactsManifest } from "../../support/paths";
import { injectScorm12Api, readScorm12State } from "../../support/scorm/inject";
import { startStaticServer, stopServer } from "../../support/standalone-server";

test.describe("export parity matrix", () => {
  test("vite, standalone, and scorm12 complete safety-check", async ({ page }) => {
    const manifest = readArtifactsManifest();
    const results: Record<string, boolean> = {};

    await page.goto("/");
    await runViteGoldenFlow(page);
    results.vite = await page
      .locator('[data-lk-check-id="safety-check"]')
      .getByRole("status")
      .textContent()
      .then((t) => t?.includes("Correct") ?? false);

    let standaloneServer: Server | undefined;
    try {
      standaloneServer = await startStaticServer(manifest.standaloneDir, 4175);
      await page.goto("http://127.0.0.1:4175/index.html");
      await completePackagedAssessments(page);
      // Packaged LXPack shell marks pass with ✓ on the nav button (not React role=status).
      await expectPackagedAssessmentPassed(page, /safety-check.*✓/);
      results.standalone = true;
    } finally {
      if (standaloneServer) await stopServer(standaloneServer);
    }

    let scormServer: Server | undefined;
    try {
      scormServer = await startStaticServer(manifest.scorm12UnpackedDir, 4177);
      await injectScorm12Api(page);
      await page.goto("http://127.0.0.1:4177/index.html");
      await completePackagedAssessments(page);
      await expectPackagedAssessmentPassed(page, /safety-check.*✓/);
      results.scorm12_ui = true;

      const scorm = await readScorm12State(page);
      const status = scorm.store["cmi.core.lesson_status"] ?? "";
      results.scorm12_lms = status === "completed" || status === "passed";
    } finally {
      if (scormServer) await stopServer(scormServer);
    }

    console.log("parity results:", results);
    expect(results.vite).toBe(true);
    expect(results.standalone).toBe(true);
    expect(results.scorm12_ui).toBe(true);
    expect(results.scorm12_lms).toBe(true);
  });
});

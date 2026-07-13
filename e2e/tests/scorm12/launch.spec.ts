import { expect, test } from "@playwright/test";
import type { Server } from "node:http";
import { completePackagedAssessments } from "../../fixtures/golden-flow";
import { readArtifactsManifest } from "../../support/paths";
import { injectScorm12Api, readScorm12State } from "../../support/scorm/inject";
import { startStaticServer, stopServer } from "../../support/standalone-server";

test.describe("golden scorm12 LMS", () => {
  let server: Server;
  let baseUrl: string;

  test.beforeAll(async () => {
    const manifest = readArtifactsManifest();
    server = await startStaticServer(manifest.scorm12UnpackedDir, 4176);
    baseUrl = `http://127.0.0.1:4176`;
  });

  test.afterAll(async () => {
    await stopServer(server);
  });

  test("launch with API mock and record completion", async ({ page }) => {
    await injectScorm12Api(page);
    await page.goto(`${baseUrl}/index.html`);
    await expect(page.getByRole("button", { name: /safety-check/i })).toBeVisible({
      timeout: 30_000,
    });

    await completePackagedAssessments(page);

    const state = await readScorm12State(page);
    const status = state.store["cmi.core.lesson_status"] ?? "";
    expect(status === "completed" || status === "passed").toBe(true);
    const raw = state.store["cmi.core.score.raw"] ?? "";
    expect(raw).not.toBe("");
    expect(Number(raw)).toBeGreaterThan(0);
    expect(state.log.length).toBeGreaterThan(0);
  });
});

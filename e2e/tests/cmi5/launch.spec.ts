import { expect, test } from "@playwright/test";
import type { Server } from "node:http";
import { completePackagedAssessments } from "../../fixtures/golden-flow";
import { readArtifactsManifest } from "../../support/paths";
import { startStaticServer, stopServer } from "../../support/standalone-server";

test.describe("golden cmi5 package", () => {
  let server: Server;
  let baseUrl: string;

  test.beforeAll(async () => {
    const manifest = readArtifactsManifest();
    server = await startStaticServer(manifest.cmi5UnpackedDir, 4181);
    baseUrl = `http://127.0.0.1:4181`;
  });

  test.afterAll(async () => {
    await stopServer(server);
  });

  test("launches shell and completes native assessments", async ({ page }) => {
    await page.goto(`${baseUrl}/index.html`);
    await expect(page.getByRole("button", { name: /safety-check/i })).toBeVisible({
      timeout: 30_000,
    });
    await completePackagedAssessments(page);
    await expect(page.getByRole("button", { name: /ppe-acknowledgment/i })).toBeVisible();
  });
});

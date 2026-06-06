import { expect, test } from "@playwright/test";
import type { Server } from "node:http";
import { completePackagedAssessments } from "../../fixtures/golden-flow";
import { readArtifactsManifest } from "../../support/paths";
import { startStaticServer, stopServer } from "../../support/standalone-server";

test.describe("golden standalone", () => {
  let server: Server;
  const port = 4178;
  let baseUrl: string;

  test.beforeAll(async () => {
    const manifest = readArtifactsManifest();
    server = await startStaticServer(manifest.standaloneDir, port);
    baseUrl = `http://127.0.0.1:${port}`;
  });

  test.afterAll(async () => {
    await stopServer(server);
  });

  test("launches shell and completes native assessments", async ({ page }) => {
    await page.goto(`${baseUrl}/index.html`);
    await expect(page.getByRole("button", { name: /safety-check/i })).toBeVisible();
    await completePackagedAssessments(page);
    await expect(page.getByRole("button", { name: /ppe-acknowledgment.*✓/ })).toBeVisible();
  });
});

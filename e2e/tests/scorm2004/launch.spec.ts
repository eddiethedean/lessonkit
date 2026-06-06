import { expect, test } from "@playwright/test";
import type { Server } from "node:http";
import { completeScorm2004Assessments } from "../../fixtures/golden-flow";
import { readArtifactsManifest } from "../../support/paths";
import { injectScorm2004Api, readScorm2004State } from "../../support/scorm/inject2004";
import { startStaticServer, stopServer } from "../../support/standalone-server";

test.describe("golden scorm2004 LMS", () => {
  let server: Server;
  let baseUrl: string;

  test.beforeAll(async () => {
    const manifest = readArtifactsManifest();
    server = await startStaticServer(manifest.scorm2004UnpackedDir, 4182);
    baseUrl = `http://127.0.0.1:4182`;
  });

  test.afterAll(async () => {
    await stopServer(server);
  });

  test("launch with API_1484_11 mock and record completion", async ({ page }) => {
    await injectScorm2004Api(page);
    await completeScorm2004Assessments(page, baseUrl);

    const state = await readScorm2004State(page);
    const completionStatus = state.store["cmi.completion_status"] ?? "";
    expect(["completed", "passed"]).toContain(completionStatus);
    expect(state.store["cmi.score.raw"]).toBeTruthy();
  });
});

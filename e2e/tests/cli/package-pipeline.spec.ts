import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import type { Server } from "node:http";
import { join } from "node:path";
import { completePackagedAssessments } from "../../fixtures/golden-flow";
import { runCliJson } from "../../support/cli";
import { ARTIFACTS_DIR, GOLDEN_DIR } from "../../support/paths";
import { injectScorm12Api, readScorm12State } from "../../support/scorm/inject";
import { unpackScormZip } from "../../support/scorm/unpack";
import { startStaticServer, stopServer } from "../../support/standalone-server";

type PackageJson = {
  ok: boolean;
  target?: string;
  outputPath?: string;
};

const CLI_SCORM12_DIR = join(ARTIFACTS_DIR, "cli-scorm12-unpacked");

test.describe("CLI package pipeline", () => {
  let server: Server;
  let baseUrl: string;

  test.beforeAll(async () => {
    if (!existsSync(join(GOLDEN_DIR, "dist", "index.html"))) {
      throw new Error(
        `Golden dist missing. Run Playwright global setup first (${join(GOLDEN_DIR, "dist")}).`,
      );
    }

    await mkdir(ARTIFACTS_DIR, { recursive: true });

    const { result, json } = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build"],
      GOLDEN_DIR,
    );

    expect(result.exitCode, result.stderr || result.stdout).toBe(0);
    expect(json.ok).toBe(true);
    expect(json.target).toBe("scorm12");
    if (!json.outputPath) {
      throw new Error("CLI package JSON missing outputPath");
    }

    await unpackScormZip(json.outputPath, CLI_SCORM12_DIR);
    server = await startStaticServer(CLI_SCORM12_DIR, 4181);
    baseUrl = "http://127.0.0.1:4181";
  });

  test.afterAll(async () => {
    if (server) {
      await stopServer(server);
    }
  });

  test("lessonkit package scorm12 produces a launchable LMS artifact", async ({ page }) => {
    await injectScorm12Api(page);
    await page.goto(`${baseUrl}/index.html`);
    await expect(page.getByRole("button", { name: /safety-check/i })).toBeVisible({
      timeout: 30_000,
    });

    await completePackagedAssessments(page);

    const state = await readScorm12State(page);
    const status = state.store["cmi.core.lesson_status"] ?? "";
    expect(status === "completed" || status === "passed").toBe(true);
    expect(state.log.length).toBeGreaterThan(0);
  });
});

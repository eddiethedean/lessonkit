import { expect, test } from "@playwright/test";
import { runViteGoldenFlow } from "../../fixtures/golden-flow";

test.describe("golden vite telemetry", () => {
  test("persists session id and records correct quiz feedback", async ({ page }) => {
    await page.goto("/");
    await runViteGoldenFlow(page);

    const sessionId = await page.evaluate(() => sessionStorage.getItem("lessonkit:sessionId"));
    expect(sessionId).toBeTruthy();

    await expect(page.locator('[data-lk-check-id="safety-check"]')).toContainText("Correct");
  });
});

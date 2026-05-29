import { expect, test } from "@playwright/test";
import { runViteGoldenFlow } from "../../fixtures/golden-flow";

test.describe("golden vite preview", () => {
  test("loads and completes sign-off assessments", async ({ page }) => {
    await page.goto("/");
    await runViteGoldenFlow(page);
    await expect(page.locator('[data-lk-check-id="safety-check"]')).toContainText("Correct");
  });
});

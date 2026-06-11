import { expect, test } from "@playwright/test";

test.describe("assessments-p0 Quiz multi-select", () => {
  test("requires Check before answering in SPA", async ({ page }) => {
    await page.goto("/");
    const block = page.locator('[data-lk-check-id="hazards-multi"]');
    await expect(block).toBeVisible({ timeout: 30_000 });
    await block.getByLabel("Phishing email").check();
    await block.getByLabel("Tailgating").check();
    await block.getByTestId("quiz-check").click();
    await expect(block.getByTestId("quiz-feedback")).toContainText("Correct");
  });
});

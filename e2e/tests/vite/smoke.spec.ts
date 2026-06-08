import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { runViteGoldenFlow } from "../../fixtures/golden-flow";

test.describe("golden vite preview", () => {
  test("loads and completes sign-off assessments", async ({ page }) => {
    await page.goto("/");
    await runViteGoldenFlow(page);
    await expect(page.locator('[data-lk-check-id="safety-check"]')).toContainText("Correct");
  });

  test("sign-off step has no serious accessibility violations", async ({ page }) => {
    await page.goto("/");
    await runViteGoldenFlow(page);
    const results = await new AxeBuilder({ page })
      .include('[data-lk-check-id="safety-check"]')
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
  });
});

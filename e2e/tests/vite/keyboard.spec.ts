import { expect, test } from "@playwright/test";
import { goToSignOffStep, waitForViteApp } from "../../fixtures/golden-flow";

test.describe("golden vite keyboard", () => {
  test("quiz choice is reachable by keyboard", async ({ page }) => {
    await page.goto("/");
    await waitForViteApp(page);
    await goToSignOffStep(page);

    const quizSection = page.locator('[data-lk-check-id="safety-check"]');
    const correct = quizSection.getByRole("radio", {
      name: "Barricade the area and notify your supervisor",
    });
    await correct.focus();
    await expect(correct).toBeFocused();
    await page.keyboard.press("Space");
    await expect(quizSection.getByRole("status")).toContainText("Correct");
  });
});

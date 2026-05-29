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

  test("lesson sidebar is activatable by keyboard", async ({ page }) => {
    await page.goto("/");
    await waitForViteApp(page);

    const signOffNav = page.getByTestId("lesson-nav-safety-signoff");
    await signOffNav.focus();
    await expect(signOffNav).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(signOffNav).toHaveAttribute("aria-current", "step");
  });

  test("knowledge check confirm choice is reachable by keyboard", async ({ page }) => {
    await page.goto("/");
    await waitForViteApp(page);
    await goToSignOffStep(page);

    const quizSection = page.locator('[data-lk-check-id="safety-check"]');
    await quizSection.getByRole("radio", { name: "Barricade the area and notify your supervisor" }).check();

    const kcSection = page.locator('[data-lk-check-id="ppe-acknowledgment"]');
    const confirm = kcSection.getByRole("radio", { name: "Yes, I confirm" });
    await confirm.focus();
    await expect(confirm).toBeFocused();
    await page.keyboard.press("Space");
    await expect(kcSection.getByRole("status")).toContainText("Correct");
  });
});

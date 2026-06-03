import { expect, test } from "@playwright/test";
import { completeAssessmentsP0ViteTrueFalse } from "../../fixtures/assessments-p0-flow";

test.describe("assessments-p0 vite preview", () => {
  test("TrueFalse completes in SPA", async ({ page }) => {
    await page.goto("/");
    await completeAssessmentsP0ViteTrueFalse(page);
    await expect(page.getByText(/Question 1 of/)).toBeVisible();
  });
});

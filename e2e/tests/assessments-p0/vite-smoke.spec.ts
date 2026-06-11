import { expect, test } from "@playwright/test";
import {
  completeAssessmentsP0ViteSingleChoiceSet,
  completeAssessmentsP0ViteSortParagraphs,
  completeAssessmentsP0ViteTrueFalse,
} from "../../fixtures/assessments-p0-flow";

test.describe("assessments-p0 vite preview", () => {
  test("TrueFalse completes in SPA", async ({ page }) => {
    await page.goto("/");
    await completeAssessmentsP0ViteTrueFalse(page);
    await expect(page.locator('[data-lk-check-id="phishing-tf"]').getByRole("status")).toContainText(
      "Correct",
    );
  });

  test("SortParagraphs checks default order", async ({ page }) => {
    await page.goto("/");
    await completeAssessmentsP0ViteSortParagraphs(page);
  });

  test("SingleChoiceSet aggregates Quiz scores", async ({ page }) => {
    await page.goto("/");
    await completeAssessmentsP0ViteSingleChoiceSet(page);
  });
});

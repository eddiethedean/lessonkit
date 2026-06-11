import { expect, test } from "@playwright/test";
import {
  completeAssessmentsP0ViteSingleChoiceSet,
  completeAssessmentsP0ViteSortParagraphs,
  completeAssessmentsP0ViteTrueFalse,
} from "../../fixtures/assessments-p0-flow";

test.describe("assessments-p0 mobile touch", () => {
  test("TrueFalse completes with tap", async ({ page }) => {
    await page.goto("/");
    await completeAssessmentsP0ViteTrueFalse(page);
    await expect(page.locator('[data-lk-check-id="phishing-tf"]').getByRole("status")).toContainText(
      "Correct",
    );
  });

  test("TrueFalse choice rows meet minimum touch height", async ({ page }) => {
    await page.goto("/");
    const tf = page.locator('[data-lk-check-id="phishing-tf"]');
    const choiceRow = tf.locator(".lk-quiz-choice").first();
    await expect(choiceRow).toBeVisible();
    const box = await choiceRow.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
  });

  test("drag blocks and SortParagraphs in assessment sequence", async ({ page }) => {
    await page.goto("/");
    await completeAssessmentsP0ViteSortParagraphs(page);
  });

  test("DragAndDrop chips meet minimum touch height before placement", async ({ page }) => {
    await page.goto("/");
    await completeAssessmentsP0ViteTrueFalse(page);
    await page.getByTestId("sequence-next").click();
    await page.locator('[data-lk-check-id="report-fib"]').getByTestId("blank-blank-0").fill("security");
    await page.locator('[data-lk-check-id="report-fib"]').getByTestId("check-blanks").click();
    await page.getByTestId("sequence-next").click();
    await page.locator('[data-lk-check-id="policy-mtw"]').getByRole("button", { name: "password" }).click();
    await page.getByTestId("sequence-next").click();
    await page.locator('[data-lk-check-id="verb-dtw"]').getByTestId("word-Report").click();
    await page.locator('[data-lk-check-id="verb-dtw"]').getByTestId("zone-0").click();
    await page.locator('[data-lk-check-id="verb-dtw"]').getByTestId("check-drag-words").click();
    await page.getByTestId("sequence-next").click();
    const dad = page.locator('[data-lk-check-id="channel-dad"]');
    await dad.scrollIntoViewIfNeeded();
    const item = dad.getByTestId("drag-item-email");
    await item.scrollIntoViewIfNeeded();
    const itemBox = await item.boundingBox();
    expect(itemBox?.height ?? 0).toBeGreaterThanOrEqual(40);
    await dad.getByTestId("drag-item-email").click();
    await dad.getByTestId("drop-risk").click();
    await dad.getByTestId("drag-item-portal").click();
    await dad.getByTestId("drop-safe").click();
    await dad.getByTestId("check-drag-drop").click();
    await expect(dad.locator('[aria-live="polite"]')).toContainText("Correct");
  });

  test("SingleChoiceSet completes on mobile", async ({ page }) => {
    await page.goto("/");
    await completeAssessmentsP0ViteSingleChoiceSet(page);
  });
});

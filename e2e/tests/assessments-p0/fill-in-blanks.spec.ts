import { expect, test } from "@playwright/test";
import { completeAssessmentsP0ViteTrueFalse } from "../../fixtures/assessments-p0-flow";

test.describe("assessments-p0 FillInTheBlanks", () => {
  test("requires Check before sequence Next", async ({ page }) => {
    await page.goto("/");
    await completeAssessmentsP0ViteTrueFalse(page);
    await page.getByTestId("sequence-next").click();

    const block = page.locator('[data-lk-check-id="report-fib"]');
    await expect(block).toBeVisible();
    await block.getByTestId("blank-blank-0").fill("security");
    await expect(page.getByTestId("sequence-next")).toBeDisabled();
    await block.getByTestId("check-blanks").click();
    await expect(page.getByTestId("sequence-next")).toBeEnabled();
  });
});

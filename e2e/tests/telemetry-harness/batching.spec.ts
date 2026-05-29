import { expect, test } from "@playwright/test";

test.describe("telemetry harness batching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("harness-controls")).toBeVisible();
    await page.evaluate(() => {
      window.__e2e!.batches.length = 0;
    });
  });

  test("batchSink receives coalesced events after manual flush", async ({ page }) => {
    const quiz = page.locator('[data-lk-check-id="harness-check"]');
    await quiz.getByRole("radio", { name: "Yes" }).check();
    await expect(quiz.getByRole("status")).toContainText("Correct");

    await page.getByTestId("flush-tracking").click();

    const batchSummary = await page.evaluate(() => {
      const batches = window.__e2e!.batches;
      const names = batches.flat().map((e) => e.name);
      return { batchCount: batches.length, names };
    });

    expect(batchSummary.batchCount).toBeGreaterThanOrEqual(1);
    expect(batchSummary.names).toContain("course_started");
    expect(batchSummary.names).toContain("quiz_answered");
    expect(batchSummary.names.filter((n) => n === "quiz_answered")).toHaveLength(1);
  });
});

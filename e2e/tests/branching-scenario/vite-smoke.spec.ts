import { expect, test } from "@playwright/test";

test.describe("branching-scenario vite preview", () => {
  test("branch choice navigates, scores visited path, and resumes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("branching-scenario")).toBeVisible();
    await expect(page.getByText("How do you close the loop?")).toBeVisible();

    await page.getByTestId("branch-choice-credit").click();
    await expect(page.getByText("Document the credit code and set a callback.")).toBeVisible();
    await page.getByRole("radio", { name: "True" }).click();
    await expect(page.getByTestId("branch-score")).toContainText("Score: 1 / 1");

    await page.reload();
    await expect(page.getByTestId("branching-scenario")).toBeVisible();
    await expect(page.getByTestId("branch-score")).toContainText("Score: 1 / 1");
  });
});

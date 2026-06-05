import { expect, test } from "@playwright/test";

test.describe("slide-deck vite preview", () => {
  test("SlideDeck navigates, scores TrueFalse, and resumes slide index", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("slide-deck")).toBeVisible();
    await expect(page.getByText("Slide 1 of 4")).toBeVisible();

    await page.getByTestId("slide-next").click();
    await expect(page.getByText("Slide 2 of 4")).toBeVisible();
    await page.getByTestId("slide-next").click();
    await expect(page.getByText("Slide 3 of 4")).toBeVisible();

    await page.getByRole("radio", { name: "False" }).click();
    await expect(page.getByText("Correct")).toBeVisible();
    await expect(page.getByTestId("deck-score")).toHaveText(/Score: 1 \/ 1/);

    await page.reload();
    await expect(page.getByTestId("slide-deck")).toBeVisible();
    await expect(page.getByText("Slide 3 of 4")).toBeVisible();
    await expect(page.getByText("Correct")).toBeVisible();
    await expect(page.getByTestId("deck-score")).toHaveText(/Score: 1 \/ 1/);
    await expect(page.getByRole("radio", { name: "False" })).toBeChecked();
  });
});

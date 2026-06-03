import { expect, test } from "@playwright/test";

test.describe("interactive-book vite preview", () => {
  test("InteractiveBook navigates and completes TrueFalse", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("interactive-book")).toBeVisible();
    await expect(page.getByText("Page 1 of 2")).toBeVisible();
    await page.getByTestId("book-next").click();
    await expect(page.getByText("Page 2 of 2")).toBeVisible();
    await page.getByRole("radio", { name: "False" }).click();
    await expect(page.getByText("Correct")).toBeVisible();
  });
});

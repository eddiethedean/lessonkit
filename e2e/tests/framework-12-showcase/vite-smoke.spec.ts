import { expect, test } from "@playwright/test";

test.describe("framework-12-showcase vite preview", () => {
  test("content-wave lesson renders Tier C blocks", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".lms-topbar-heading")).toHaveText("Atlas Analytics", {
      timeout: 30_000,
    });
    await page.getByRole("button", { name: /1\.6 content wave/i }).click();
    await expect(page.getByTestId("heading-wave-intro")).toBeVisible();
    await expect(page.getByRole("table", { name: /release waves/i })).toBeVisible();
    await expect(page.getByTestId("timeline-block")).toBeVisible();
  });
});

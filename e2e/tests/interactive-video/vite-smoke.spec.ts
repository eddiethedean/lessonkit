import { expect, test } from "@playwright/test";

test.describe("interactive-video vite preview", () => {
  test("renders InteractiveVideo compound and 1.4 blocks", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("interactive-video")).toBeVisible();
    await expect(page.getByTestId("interactive-video-player")).toBeVisible();
    await expect(page.getByTestId("memory-game")).toBeVisible();
    await expect(page.getByTestId("information-wall")).toBeVisible();
  });
});

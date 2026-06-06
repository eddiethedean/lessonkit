import { expect, test } from "@playwright/test";

test.describe("interactive-video vite preview", () => {
  test("InteractiveVideo cue requires answer, scores, and resumes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("interactive-video")).toBeVisible();
    await expect(page.getByTestId("interactive-video-player")).toBeVisible();

    await page.evaluate(() => {
      const video = document.querySelector(
        '[data-testid="interactive-video-player"]',
      ) as HTMLVideoElement;
      video.currentTime = 6;
      video.dispatchEvent(new Event("timeupdate", { bubbles: true }));
    });

    await expect(page.getByTestId("timed-cue-0")).toBeVisible();
    const continueBtn = page.getByTestId("cue-continue");
    await expect(continueBtn).toBeDisabled();

    await page.getByRole("radio", { name: "True" }).click();
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    await expect(page.getByTestId("cue-continue")).toBeHidden();

    await expect(page.getByTestId("video-score")).toContainText("Score: 1 / 1");

    await page.reload();
    await expect(page.getByTestId("interactive-video")).toBeVisible();
    await expect(page.getByTestId("video-score")).toContainText("Score: 1 / 1");
  });

  test("renders other 1.4 blocks", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("memory-game")).toBeVisible();
    await expect(page.getByTestId("information-wall")).toBeVisible();
    await expect(page.getByTestId("video")).toBeVisible();
  });
});

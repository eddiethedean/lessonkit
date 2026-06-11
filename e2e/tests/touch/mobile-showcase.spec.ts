import { expect, test } from "@playwright/test";

async function advanceToFindHotspot(page: import("@playwright/test").Page): Promise<void> {
  await page.locator('[data-lk-check-id="atlas-sso-tf"]').getByRole("radio", { name: "False" }).check();
  await page.getByTestId("sequence-next").click();

  const fib = page.locator('[data-lk-check-id="report-channel-fib"]');
  await fib.getByTestId("blank-blank-0").fill("security");
  await fib.getByTestId("check-blanks").click();
  await page.getByTestId("sequence-next").click();

  await page.locator('[data-lk-check-id="policy-mtw"]').getByRole("button", { name: "credentials" }).click();
  await page.getByTestId("sequence-next").click();

  const dtw = page.locator('[data-lk-check-id="sync-dtw"]');
  await dtw.getByTestId("word-Validate").click();
  await dtw.getByTestId("zone-0").click();
  await dtw.getByTestId("check-drag-words").click();
  await page.getByTestId("sequence-next").click();

  const dad = page.locator('[data-lk-check-id="export-dad"]');
  await dad.scrollIntoViewIfNeeded();
  await dad.getByTestId("drag-item-csv").click();
  await dad.getByTestId("drop-vault").click();
  await dad.getByTestId("drag-item-slide").click();
  await dad.getByTestId("drop-deck").click();
  await dad.getByTestId("check-drag-drop").click();
  await page.getByTestId("sequence-next").click();
}

test.describe("framework-12-showcase mobile touch", () => {
  test("FindHotspot target is tappable on coarse pointer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".lms-topbar-heading")).toHaveText("Atlas Analytics", {
      timeout: 30_000,
    });
    await page.getByTestId("lesson-nav-certification").click();
    await advanceToFindHotspot(page);

    const block = page.locator('[data-lk-check-id="alert-hs"]');
    const hotspot = block.getByRole("button", { name: "Ack alert" });
    await hotspot.scrollIntoViewIfNeeded();
    const box = await hotspot.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(40);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
    await hotspot.click();
    await expect(block.getByTestId("check-hotspot")).toBeEnabled();
    await block.getByTestId("check-hotspot").click();
    await expect(page.locator('[data-lk-check-id="alert-hs"]').getByRole("status")).toContainText(
      "Correct",
    );
  });
});

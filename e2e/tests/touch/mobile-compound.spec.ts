import { expect, test } from "@playwright/test";

test.describe("slide-deck mobile touch", () => {
  test("compound nav buttons meet minimum touch height", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("slide-deck")).toBeVisible();

    const prev = page.getByTestId("slide-prev");
    const next = page.getByTestId("slide-next");
    const prevBox = await prev.boundingBox();
    const nextBox = await next.boundingBox();
    expect(prevBox?.height ?? 0).toBeGreaterThanOrEqual(40);
    expect(nextBox?.height ?? 0).toBeGreaterThanOrEqual(40);

    await next.click();
    await expect(page.getByText("Slide 2 of 4")).toBeVisible();
  });
});

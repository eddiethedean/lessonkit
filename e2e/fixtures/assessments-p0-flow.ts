import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function completeAssessmentsP0ViteTrueFalse(page: Page): Promise<void> {
  const block = page.locator('[data-lk-check-id="phishing-tf"]');
  await expect(block).toBeVisible({ timeout: 30_000 });
  await block.getByRole("radio", { name: "False" }).check();
  await expect(block.getByRole("status")).toContainText("Correct");
}

/** LXPack SCORM shell: trueFalse is injected as a native shell quiz. */
export async function completeAssessmentsP0ScormShell(page: Page): Promise<void> {
  await expect(page.getByRole("button", { name: /phishing-tf/i })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: /phishing-tf/i }).click();
  await page.getByText("False", { exact: true }).click();
  await page.getByRole("button", { name: /Submit assessment/i }).click();
}

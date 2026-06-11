import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function completeAssessmentsP0ViteTrueFalse(page: Page): Promise<void> {
  const block = page.locator('[data-lk-check-id="phishing-tf"]');
  await expect(block).toBeVisible({ timeout: 30_000 });
  await block.getByRole("radio", { name: "False" }).check();
  await expect(block.getByRole("status")).toContainText("Correct");
}

async function clickSequenceNext(page: Page): Promise<void> {
  await page.getByTestId("sequence-next").click();
}

export async function completeAssessmentsP0ViteSequenceThroughSort(page: Page): Promise<void> {
  await completeAssessmentsP0ViteTrueFalse(page);
  await clickSequenceNext(page);

  const fib = page.locator('[data-lk-check-id="report-fib"]');
  await fib.getByTestId("blank-blank-0").fill("security");
  await fib.getByTestId("check-blanks").click();
  await clickSequenceNext(page);

  const mtw = page.locator('[data-lk-check-id="policy-mtw"]');
  await mtw.getByRole("button", { name: "password" }).click();
  await clickSequenceNext(page);

  const dtw = page.locator('[data-lk-check-id="verb-dtw"]');
  await dtw.getByTestId("word-Report").click();
  await dtw.getByTestId("zone-0").click();
  await dtw.getByTestId("check-drag-words").click();
  await clickSequenceNext(page);

  const dad = page.locator('[data-lk-check-id="channel-dad"]');
  await dad.scrollIntoViewIfNeeded();
  await expect(dad).toBeVisible();
  await dad.getByTestId("drag-item-email").click();
  await dad.getByTestId("drop-risk").click();
  await dad.getByTestId("drag-item-portal").click();
  await dad.getByTestId("drop-safe").click();
  await dad.getByTestId("check-drag-drop").click();
  await clickSequenceNext(page);
}

export async function completeAssessmentsP0ViteSortParagraphs(page: Page): Promise<void> {
  await completeAssessmentsP0ViteSequenceThroughSort(page);
  const block = page.locator('[data-lk-check-id="incident-sort"]');
  await expect(block).toBeVisible({ timeout: 30_000 });
  await block.getByTestId("sort-paragraphs-check").click();
  await expect(block.getByTestId("sort-paragraphs-feedback")).toContainText("Correct");
}

export async function completeAssessmentsP0ViteSingleChoiceSet(page: Page): Promise<void> {
  const set = page.getByTestId("single-choice-set");
  await expect(set).toBeVisible({ timeout: 30_000 });
  const q1 = page.locator('[data-lk-check-id="scs-report"]');
  await q1.getByRole("radio", { name: "No" }).check();
  await set.getByTestId("single-choice-set-next").click();
  const q2 = page.locator('[data-lk-check-id="scs-portal"]');
  await q2.getByRole("radio", { name: "Yes" }).check();
  await expect(set.getByTestId("single-choice-set-score")).toContainText("Score: 2");
}

/** LXPack SCORM shell: injectable assessments appear as native shell quizzes. */
export async function completeAssessmentsP0ScormShell(page: Page): Promise<void> {
  await expect(page.getByRole("button", { name: /p0 interactions/i })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: /p0 interactions/i }).click();
  await page.getByRole("button", { name: /mark complete/i }).click();

  const shellQuizzes: Array<{ id: string; choice: string }> = [
    { id: "phishing-tf", choice: "False" },
    { id: "channel-mm", choice: "Service portal" },
    { id: "scs-report", choice: "No" },
    { id: "scs-portal", choice: "Yes" },
  ];

  for (const quiz of shellQuizzes) {
    await expect(page.getByRole("button", { name: new RegExp(quiz.id, "i") })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: new RegExp(quiz.id, "i") }).click();
    await page.getByText(quiz.choice, { exact: true }).click();
    await page.getByRole("button", { name: /Submit assessment/i }).click();
  }
}

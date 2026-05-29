import type { FrameLocator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

const QUIZ_CORRECT = "Barricade the area and notify your supervisor";
const KC_CORRECT = "Yes, I confirm";

/** Wait for the golden React app shell (Vite / preview). */
export async function waitForViteApp(page: Page): Promise<void> {
  await expect(page.locator(".lms-topbar-heading")).toContainText(/Warehouse Safety/i, {
    timeout: 30_000,
  });
}

/** Navigate to the sign-off step in the full React golden app (Vite only). */
export async function goToSignOffStep(root: Page | FrameLocator): Promise<void> {
  await root.getByTestId("lesson-nav-safety-signoff").click();
  await expect(root.getByTestId("lesson-nav-safety-signoff")).toHaveAttribute("aria-current", "step");
}

/** Complete React Quiz + KnowledgeCheck on the sign-off step (Vite). */
export async function completeSignOffAssessments(root: Page | FrameLocator): Promise<void> {
  const quizSection = root.locator('[data-lk-check-id="safety-check"]');
  await quizSection.getByRole("radio", { name: QUIZ_CORRECT }).check();
  await expect(quizSection.getByRole("status")).toContainText("Correct");

  const kcSection = root.locator('[data-lk-check-id="ppe-acknowledgment"]');
  await kcSection.getByRole("radio", { name: KC_CORRECT }).check();
}

/** Full React authoring flow (Vite preview). */
export async function runViteGoldenFlow(page: Page): Promise<void> {
  await waitForViteApp(page);
  await goToSignOffStep(page);
  await completeSignOffAssessments(page);
}

/**
 * LXPack standalone / SCORM shell: assessments are native quizzes in the shell nav
 * (safety-check, ppe-acknowledgment), not the multi-step React sign-off route.
 */
export async function completePackagedAssessments(page: Page): Promise<void> {
  await page.getByRole("button", { name: /safety-check/i }).click();
  await page.getByText(QUIZ_CORRECT, { exact: true }).click();
  await page.getByRole("button", { name: /Submit assessment/i }).click();

  await page.getByRole("button", { name: /ppe-acknowledgment/i }).click();
  await page.getByText(KC_CORRECT, { exact: true }).click();
  await page.getByRole("button", { name: /Submit assessment/i }).click();
}

/** SCORM 2004 multi-SCO layout: one assessment per SCO launch URL. */
export async function completeScorm2004Assessments(page: Page, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/sco/safety-check/index.html`);
  await page.getByText(QUIZ_CORRECT, { exact: true }).click();
  await page.getByRole("button", { name: /Submit assessment/i }).click();

  await page.goto(`${baseUrl}/sco/ppe-acknowledgment/index.html`);
  await page.getByText(KC_CORRECT, { exact: true }).click();
  await page.getByRole("button", { name: /Submit assessment/i }).click();
}

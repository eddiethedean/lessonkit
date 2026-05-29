import type { Page } from "@playwright/test";
import { scorm12ApiInitScript } from "./api12-script";

export async function injectScorm12Api(page: Page): Promise<void> {
  await page.addInitScript(scorm12ApiInitScript);
}

export type Scorm12TestState = {
  store: Record<string, string>;
  log: Array<{ element: string; value: string }>;
};

export async function readScorm12State(page: Page): Promise<Scorm12TestState> {
  return page.evaluate(() => {
    const root = window as unknown as { __scorm12Test?: Scorm12TestState };
    if (!root.__scorm12Test) {
      throw new Error("SCORM 1.2 test API not injected");
    }
    return root.__scorm12Test;
  });
}

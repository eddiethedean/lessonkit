import type { Page } from "@playwright/test";
import { scorm2004ApiInitScript } from "./api2004-script";

export async function injectScorm2004Api(page: Page): Promise<void> {
  await page.addInitScript(scorm2004ApiInitScript);
}

export type Scorm2004TestState = {
  store: Record<string, string>;
  log: Array<{ element: string; value: string }>;
};

export async function readScorm2004State(page: Page): Promise<Scorm2004TestState> {
  return page.evaluate(() => {
    const root = window as unknown as { __scorm2004Test?: Scorm2004TestState };
    if (!root.__scorm2004Test) {
      throw new Error("SCORM 2004 test API not injected");
    }
    return root.__scorm2004Test;
  });
}

import { expect, test } from "@playwright/test";

test.describe("telemetry harness xAPI queue", () => {
  test("queues statements when transport fails then delivers on flush after mode ok", async ({
    page,
  }) => {
    await page.goto("/?xapiMode=fail");
    await expect(page.getByTestId("harness-controls")).toBeVisible();

    await page.waitForFunction(() => (window.__e2e?.xapiErrors ?? 0) > 0);

    const beforeFlush = await page.evaluate(() => ({
      xapiCalls: window.__e2e!.xapiCalls.length,
      queueSize: window.__e2e!.getXapiQueueSize(),
      xapiErrors: window.__e2e!.xapiErrors,
    }));

    expect(beforeFlush.xapiErrors).toBeGreaterThan(0);
    expect(beforeFlush.xapiCalls).toBe(0);
    expect(beforeFlush.queueSize).toBeGreaterThan(0);

    await page.evaluate(() => {
      window.__e2e!.setXapiMode("ok");
    });
    await page.getByTestId("flush-xapi").click();

    await page.waitForFunction(() => window.__e2e!.xapiCalls.length > 0);

    const afterFlush = await page.evaluate(() => ({
      xapiCalls: window.__e2e!.xapiCalls.length,
      queueSize: window.__e2e!.getXapiQueueSize(),
    }));

    expect(afterFlush.xapiCalls).toBeGreaterThan(0);
    expect(afterFlush.queueSize).toBe(0);
  });
});

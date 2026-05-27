import { describe, expect, it, vi } from "vitest";
import { createInMemoryXAPIQueue, createXAPIClient } from "../src";

describe("@lessonkit/xapi", () => {
  it("queues when transport fails and flushes later", async () => {
    const queue = createInMemoryXAPIQueue();
    const transport = vi.fn(async (_statement: unknown) => {
      throw new Error("network");
    }) as unknown as (statement: unknown) => Promise<void>;

    const client = createXAPIClient({ transport, baseId: "urn:test", queue });
    client.startedLesson({ lessonId: "lesson-1" });

    // Allow async transport rejection handler to run.
    await new Promise((r) => setTimeout(r, 0));

    expect(client.queueSize()).toBe(1);

    (transport as unknown as { mockImplementation: (fn: any) => void }).mockImplementation(async () => {});
    await client.flush();

    expect(client.queueSize()).toBe(0);
    expect(transport).toHaveBeenCalled();
  });

  it("adds duration and score to completion result", async () => {
    const statements: any[] = [];
    const client = createXAPIClient({
      baseId: "urn:test",
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.completeLesson({ lessonId: "lesson-1", durationMs: 1500, score: 7, maxScore: 10, success: true });

    await Promise.resolve();

    expect(statements).toHaveLength(1);
    expect(statements[0].result).toMatchObject({
      duration: "PT1.5S",
      success: true,
      score: { raw: 7, max: 10, min: 0, scaled: 0.7 },
    });
  });
});


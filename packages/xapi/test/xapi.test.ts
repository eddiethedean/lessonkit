import { describe, expect, it, vi } from "vitest";
import { createInMemoryXAPIQueue, createXAPIClient } from "../src";

describe("@lessonkit/xapi", () => {
  it("sends a course completion statement", async () => {
    const statements: any[] = [];
    const client = createXAPIClient({
      baseId: "urn:test",
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.completeCourse();
    await Promise.resolve();

    expect(statements).toHaveLength(1);
    expect(statements[0]).toMatchObject({
      verb: "http://adlnet.gov/expapi/verbs/completed",
      object: { id: "urn:test:course" },
    });
  });

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

  it("queues statements when no transport is provided", () => {
    const queue = createInMemoryXAPIQueue();
    const client = createXAPIClient({ baseId: "urn:test", queue });
    client.startedLesson({ lessonId: "lesson-1" });
    expect(client.queueSize()).toBe(1);
  });

  it("uses Math.random fallback when crypto.randomUUID is unavailable", async () => {
    vi.stubGlobal("crypto", {});
    const queue = createInMemoryXAPIQueue();
    const client = createXAPIClient({ baseId: "urn:test", queue });
    client.startedLesson({ lessonId: "lesson-1" });
    expect(client.queueSize()).toBe(1);
    vi.unstubAllGlobals();
  });

  it("send() forwards statements to transport", async () => {
    const statements: any[] = [];
    const client = createXAPIClient({
      baseId: "urn:test",
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.send({ id: "1", timestamp: "t", verb: "v", object: { id: "o" } });
    await Promise.resolve();
    expect(statements).toHaveLength(1);
    expect(statements[0]).toMatchObject({ id: "1" });
  });

  it("queue flush stops on first transport error and keeps remainder queued", async () => {
    const queue = createInMemoryXAPIQueue();
    queue.enqueue({ id: "1", timestamp: "t", verb: "v", object: { id: "o" } });
    queue.enqueue({ id: "2", timestamp: "t", verb: "v", object: { id: "o" } });

    const transport = vi
      .fn<[], Promise<void>>()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(undefined);

    await queue.flush(transport as unknown as any);
    expect(queue.size()).toBe(2);
    expect(transport).toHaveBeenCalledTimes(1);

    await queue.flush(transport as unknown as any);
    expect(queue.size()).toBe(0);
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

  it("formats integer seconds without decimals (durationMs=2000 => PT2S)", async () => {
    const statements: any[] = [];
    const client = createXAPIClient({
      baseId: "urn:test",
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.completeLesson({ lessonId: "lesson-1", durationMs: 2000 });
    await Promise.resolve();

    expect(statements).toHaveLength(1);
    expect(statements[0].result).toMatchObject({ duration: "PT2S" });
  });

  it("omits result when completion has no extra fields", async () => {
    const statements: any[] = [];
    const client = createXAPIClient({
      baseId: "urn:test",
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.completeLesson({ lessonId: "lesson-1" });
    await Promise.resolve();

    expect(statements).toHaveLength(1);
    expect(statements[0].result).toBeUndefined();
  });
});


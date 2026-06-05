import { describe, expect, it, vi } from "vitest";
import { createInMemoryXAPIQueue, createXAPIClient } from "../src";
import type { XAPIStatement } from "../src";

const courseId = "test";

describe("@lessonkit/xapi", () => {
  it("sends a course completion statement", async () => {
    const statements: XAPIStatement[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.completeCourse();
    await Promise.resolve();

    expect(statements).toHaveLength(1);
    expect(statements[0]).toMatchObject({
      verb: "http://adlnet.gov/expapi/verbs/completed",
      object: { id: "urn:lessonkit:course:test" },
    });
  });

  it("queues when transport fails and flushes later", async () => {
    const queue = createInMemoryXAPIQueue();
    const transport = vi.fn<(statement: unknown) => Promise<void>>(async (_statement: unknown) => {
      throw new Error("network");
    });

    const client = createXAPIClient({ transport, courseId, queue });
    client.startedLesson({ lessonId: "lesson-1" });

    await new Promise((r) => setTimeout(r, 0));

    expect(client.queueSize()).toBe(1);

    transport.mockImplementation(async () => {});
    await client.flush();

    expect(client.queueSize()).toBe(0);
    expect(transport).toHaveBeenCalled();
  });

  it("queues statements when no transport is provided", () => {
    const queue = createInMemoryXAPIQueue();
    const client = createXAPIClient({ courseId, queue });
    client.startedLesson({ lessonId: "lesson-1" });
    expect(client.queueSize()).toBe(1);
  });

  it("warns in dev when statements queue without transport", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");

    try {
      const client = createXAPIClient({ courseId });
      client.startedLesson({ lessonId: "lesson-1" });
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/no transport/));
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("does not warn in production when statements queue without transport", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");

    try {
      const client = createXAPIClient({ courseId });
      client.startedLesson({ lessonId: "lesson-1" });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("warns in dev when transport fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    const transport = vi.fn(async () => {
      throw new Error("network");
    });

    try {
      const client = createXAPIClient({ transport, courseId });
      client.startedLesson({ lessonId: "lesson-1" });
      await new Promise((r) => setTimeout(r, 0));
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/transport failed/));
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("uses Math.random fallback when crypto.randomUUID is unavailable", async () => {
    vi.stubGlobal("crypto", {});
    const queue = createInMemoryXAPIQueue();
    const client = createXAPIClient({ courseId, queue });
    client.startedLesson({ lessonId: "lesson-1" });
    expect(client.queueSize()).toBe(1);
    vi.unstubAllGlobals();
  });

  it("send() forwards statements to transport", async () => {
    const statements: XAPIStatement[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.send({ id: "1", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o" } });
    await Promise.resolve();
    expect(statements).toHaveLength(1);
    expect(statements[0]).toMatchObject({ id: "1" });
  });

  it("retries duplicate send after in-flight transport failure", async () => {
    let calls = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport = vi.fn(async () => {
      calls += 1;
      await gate;
      if (calls === 1) {
        throw new Error("network");
      }
    });
    const client = createXAPIClient({ transport, courseId });
    const statement: XAPIStatement = {
      id: "retry-inflight-1",
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o" },
    };

    client.send(statement);
    client.send(statement);
    release();
    await new Promise((r) => setTimeout(r, 0));

    expect(calls).toBe(2);
    expect(client.queueSize()).toBe(1);
    transport.mockImplementation(async () => {});
    const flushPromise = client.flush();
    await new Promise((r) => setTimeout(r, 0));
    expect(client.queueSize()).toBe(0);
    await flushPromise;
  });

  it("does not send duplicate in-flight statements with the same id", async () => {
    const statements: XAPIStatement[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport = vi.fn(async (statement: XAPIStatement) => {
      await gate;
      statements.push(statement);
    });
    const client = createXAPIClient({ transport, courseId });
    const statement: XAPIStatement = { id: "inflight-1", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o" } };

    client.send(statement);
    client.send(statement);
    release();
    await new Promise((r) => setTimeout(r, 0));

    expect(transport).toHaveBeenCalledTimes(1);
    expect(statements).toHaveLength(1);
  });

  it("does not duplicate queued statements with the same id on transport failure", async () => {
    const queue = createInMemoryXAPIQueue();
    const transport = vi.fn(async () => {
      throw new Error("network");
    });
    const client = createXAPIClient({ transport, courseId, queue });
    const statement: XAPIStatement = {
      id: "dup-1",
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o" },
    };

    client.send(statement);
    client.send(statement);
    await new Promise((r) => setTimeout(r, 0));

    expect(client.queueSize()).toBe(1);
  });

  it("auto-generates statement ids and dedupes empty-id sends on transport failure", async () => {
    const queue = createInMemoryXAPIQueue();
    const transport = vi.fn(async () => {
      throw new Error("network");
    });
    const client = createXAPIClient({ transport, courseId, queue });
    const statement: XAPIStatement = {
      id: "",
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o" },
    };

    client.send(statement);
    client.send(statement);
    await new Promise((r) => setTimeout(r, 0));

    expect(statement.id).toBeTruthy();
    expect(client.queueSize()).toBe(1);
  });

  it("emit() does not throw when mapper fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    const mapModule = await import("../src/telemetryMap");
    const mapSpy = vi
      .spyOn(mapModule, "telemetryEventToXAPIStatement")
      .mockImplementation(() => {
        throw new Error("bad mapping");
      });
    const transport = vi.fn(async () => {});
    const client = createXAPIClient({ courseId, transport });

    try {
      expect(() => client.startedLesson({ lessonId: "lesson-1" })).not.toThrow();
      await Promise.resolve();
      expect(warn).toHaveBeenCalledWith("[lessonkit] xAPI mapping skipped:", "bad mapping");
      expect(transport).not.toHaveBeenCalled();
    } finally {
      mapSpy.mockRestore();
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("refuses enqueue at cap while the head statement is in flight", async () => {
    const queue = createInMemoryXAPIQueue({ maxSize: 2 });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport = vi.fn(async () => {
      await gate;
    });

    queue.enqueue({ id: "head", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o1" } });
    queue.enqueue({ id: "tail", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o2" } });

    const flushPromise = queue.flush(transport);
    await new Promise((r) => setTimeout(r, 0));

    expect(queue.size()).toBe(2);
    queue.enqueue({ id: "new", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o3" } });
    expect(queue.size()).toBe(2);

    release();
    await flushPromise;
    expect(transport).toHaveBeenCalled();
  });

  it("queue flush stops on first transport error and keeps remainder queued", async () => {
    const queue = createInMemoryXAPIQueue();
    queue.enqueue({ id: "1", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o" } });
    queue.enqueue({ id: "2", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o" } });

    const transport = vi
      .fn<(statement: unknown) => Promise<void>>(async (_statement: unknown) => {})
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(undefined);

    await queue.flush(transport);
    expect(queue.size()).toBe(2);
    expect(transport).toHaveBeenCalledTimes(1);

    await queue.flush(transport);
    expect(queue.size()).toBe(0);
  });

  it("adds duration and score to completion result", async () => {
    const statements: XAPIStatement[] = [];
    const client = createXAPIClient({
      courseId,
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
    expect(statements[0].object.id).toBe("urn:lessonkit:course:test:lesson:lesson-1");
  });

  it("formats integer seconds without decimals (durationMs=2000 => PT2S)", async () => {
    const statements: XAPIStatement[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.completeLesson({ lessonId: "lesson-1", durationMs: 2000 });
    await Promise.resolve();

    expect(statements).toHaveLength(1);
    expect(statements[0].result).toMatchObject({ duration: "PT2S" });
  });

  it("flush is noop without transport", async () => {
    const client = createXAPIClient({ courseId });
    await expect(client.flush()).resolves.toBeUndefined();
  });

  it("flush awaits in-flight direct sends before resolving", async () => {
    const delivered: XAPIStatement[] = [];
    let releaseTransport!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseTransport = resolve;
    });
    const transport = vi.fn(async (statement: XAPIStatement) => {
      await gate;
      delivered.push(statement);
    });
    const client = createXAPIClient({ transport });
    client.send({
      id: "inflight-1",
      timestamp: "2020-01-01T00:00:00Z",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "urn:example:activity" },
    });

    const flushPromise = client.flush();
    await Promise.resolve();
    expect(delivered).toHaveLength(0);

    releaseTransport();
    await flushPromise;
    expect(delivered).toHaveLength(1);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("drops oldest statements when queue exceeds maxSize and calls onCap", () => {
    const caps: number[] = [];
    const depths: number[] = [];
    const queue = createInMemoryXAPIQueue({
      maxSize: 2,
      onCap: () => caps.push(1),
      onDepth: (n) => depths.push(n),
    });
    const stmt = (id: string): XAPIStatement => ({
      id,
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o" },
    });
    queue.enqueue(stmt("1"));
    queue.enqueue(stmt("2"));
    queue.enqueue(stmt("3"));
    expect(queue.size()).toBe(2);
    expect(caps).toHaveLength(1);
    expect(depths.at(-1)).toBe(2);
  });

  it("coalesces concurrent flush calls so each statement is sent once", async () => {
    const queue = createInMemoryXAPIQueue();
    queue.enqueue({ id: "1", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o1" } });
    queue.enqueue({ id: "2", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o2" } });

    const delivered: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const transport = vi.fn(async (statement: XAPIStatement) => {
      delivered.push(statement.id);
      if (delivered.length === 1) {
        await gate;
      }
    });

    const first = queue.flush(transport);
    const second = queue.flush(transport);
    release();
    await Promise.all([first, second]);

    expect(delivered).toEqual(["1", "2"]);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(queue.size()).toBe(0);
  });

  it("lifecycle helpers noop without courseId", async () => {
    const transport = vi.fn(async () => {});
    const client = createXAPIClient({ transport });
    client.startedLesson({ lessonId: "lesson-1" });
    client.completeLesson({ lessonId: "lesson-1" });
    client.completeCourse();
    await Promise.resolve();
    expect(transport).not.toHaveBeenCalled();
  });

  it("omits result when completion has no extra fields", async () => {
    const statements: XAPIStatement[] = [];
    const client = createXAPIClient({
      courseId,
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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createXAPIClient } from "../src/client";
import type { XAPIStatement } from "../src";

const courseId = "test-course";

describe("createXAPIClient statement idempotency", () => {
  beforeEach(() => {
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue("2026-01-01T00:00:00.000Z");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps repeated completeCourse calls to identical statement ids", async () => {
    const sent: string[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async (statement) => {
        sent.push(statement.id);
      },
    });

    client.completeCourse();
    client.completeCourse();
    await client.flush();

    expect(sent.length).toBeGreaterThanOrEqual(2);
    expect(sent[0]).toBeTruthy();
    expect(sent[0]).toBe(sent[1]);
  });

  it("maps repeated startedLesson calls to identical statement ids", async () => {
    const sent: string[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async (statement) => {
        sent.push(statement.id);
      },
    });

    client.startedLesson({ lessonId: "lesson-1" });
    client.startedLesson({ lessonId: "lesson-1" });
    await client.flush();

    expect(sent.length).toBeGreaterThanOrEqual(2);
    expect(sent[0]).toBe(sent[1]);
  });

  it("preserves statement id when transport fails and flush retries", async () => {
    const ids: string[] = [];
    let fail = true;
    const transport = vi.fn(async (statement: XAPIStatement) => {
      ids.push(statement.id);
      if (fail) {
        fail = false;
        throw new Error("network");
      }
    });

    const client = createXAPIClient({ courseId, transport });
    client.completeCourse();
    await new Promise((r) => setTimeout(r, 0));
    await client.flush();

    expect(ids.length).toBeGreaterThanOrEqual(2);
    expect(ids[0]).toBe(ids[1]);
  });

  it("dedupes completeCourse across different timestamps via stable event id", async () => {
    vi.restoreAllMocks();
    const sent: string[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async (statement) => {
        sent.push(statement.id);
      },
    });

    client.completeCourse();
    await new Promise((r) => setTimeout(r, 5));
    client.completeCourse();
    await client.flush();

    expect(sent.length).toBeGreaterThanOrEqual(2);
    expect(sent[0]).toBe(sent[1]);
  });
});

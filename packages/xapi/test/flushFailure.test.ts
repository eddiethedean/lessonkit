import { describe, expect, it, vi } from "vitest";
import { createInMemoryXAPIQueue, createXAPIClient } from "../src";

describe("xAPI flush failure propagation", () => {
  it("rejects flush when queue head transport fails", async () => {
    const queue = createInMemoryXAPIQueue();
    const transport = vi.fn(async () => {
      throw new Error("lrs-down");
    });
    const client = createXAPIClient({
      courseId: "course-1",
      transport,
      queue,
    });

    client.send({
      id: "stmt-1",
      timestamp: "2026-01-01T00:00:00Z",
      verb: "http://adlnet.gov/expapi/verbs/initialized",
      object: { id: "urn:example:activity" },
    });

    await expect(client.flush()).rejects.toThrow("lrs-down");
    expect(client.queueSize()).toBeGreaterThan(0);
  });
});

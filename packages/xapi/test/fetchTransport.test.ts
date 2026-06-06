import { describe, expect, it, vi, afterEach } from "vitest";
import { createFetchTransport, createFetchBatchSink } from "../src/fetchTransport";

describe("createFetchTransport", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("POSTs statement with timeout and succeeds on ok response", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 204 })),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const { transport } = createFetchTransport({
      url: "https://lrs.example/statements",
      timeoutMs: 0,
      retries: 0,
    });

    await transport({
      id: "s1",
      timestamp: "2026-01-01T00:00:00Z",
      verb: "http://adlnet.gov/expapi/verbs/completed",
      object: { id: "https://example.com/a" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://lrs.example/statements",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("throws when response is not ok", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response("bad", { status: 500, statusText: "Server Error" })),
    ) as typeof fetch;

    const { transport } = createFetchTransport({
      url: "https://lrs.example/statements",
      retries: 0,
      timeoutMs: 0,
    });

    await expect(
      transport({
        id: "s1",
        timestamp: "2026-01-01T00:00:00Z",
        verb: "http://adlnet.gov/expapi/verbs/completed",
        object: { id: "https://example.com/a" },
      }),
    ).rejects.toThrow(/xAPI fetch failed: 500/);
  });

  it("resolves dynamic headers", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    globalThis.fetch = fetchMock as typeof fetch;

    const { transport } = createFetchTransport({
      url: "https://lrs.example/statements",
      headers: () => ({ Authorization: "Bearer token" }),
      retries: 0,
      timeoutMs: 0,
    });

    await transport({
      id: "s1",
      timestamp: "2026-01-01T00:00:00Z",
      verb: "http://adlnet.gov/expapi/verbs/completed",
      object: { id: "https://example.com/a" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://lrs.example/statements",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      }),
    );
  });

  it("retries with backoff then throws", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new Error("network"))
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValueOnce(new Response(null, { status: 204 }));
      globalThis.fetch = fetchMock as typeof fetch;

      const { transport } = createFetchTransport({
        url: "https://lrs.example/statements",
        retries: 2,
        backoffMs: 100,
        timeoutMs: 0,
      });

      const promise = transport({
        id: "s1",
        timestamp: "2026-01-01T00:00:00Z",
        verb: "http://adlnet.gov/expapi/verbs/completed",
        object: { id: "https://example.com/a" },
      });
      await vi.runAllTimersAsync();
      await promise;
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it("exitTransport uses keepalive fetch", () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    globalThis.fetch = fetchMock as typeof fetch;

    const { exitTransport } = createFetchTransport({
      url: "https://lrs.example/statements",
    });

    exitTransport({
      id: "s1",
      timestamp: "2026-01-01T00:00:00Z",
      verb: "http://adlnet.gov/expapi/verbs/completed",
      object: { id: "https://example.com/a" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://lrs.example/statements",
      expect.objectContaining({ keepalive: true }),
    );
  });
});

describe("createFetchBatchSink", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("POSTs JSON array batch", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    globalThis.fetch = fetchMock as typeof fetch;

    const { batchSink } = createFetchBatchSink({ url: "/api/batch", retries: 0, timeoutMs: 0 });
    await batchSink([{ name: "course_started" }]);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/batch",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify([{ name: "course_started" }]),
      }),
    );
  });

  it("throws when batch response is not ok", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response("bad", { status: 502, statusText: "Bad Gateway" })),
    ) as typeof fetch;

    const { batchSink } = createFetchBatchSink({ url: "/api/batch", retries: 0, timeoutMs: 0 });

    await expect(batchSink([{ name: "course_started" }])).rejects.toThrow(
      /telemetry batch fetch failed: 502/,
    );
  });

  it("exitBatchSink uses keepalive fetch", () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    globalThis.fetch = fetchMock as typeof fetch;

    const { exitBatchSink } = createFetchBatchSink({ url: "/api/batch" });
    exitBatchSink([{ name: "course_started" }]);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/batch",
      expect.objectContaining({ keepalive: true }),
    );
  });
});

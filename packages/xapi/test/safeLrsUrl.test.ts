import { afterEach, describe, expect, it, vi } from "vitest";
import { assertSafeLrsUrl } from "../src/safeLrsUrl";
import { createFetchBatchSink, createFetchTransport } from "../src/fetchTransport";

describe("assertSafeLrsUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows public HTTPS URLs", () => {
    expect(() => assertSafeLrsUrl("https://lrs.example/statements")).not.toThrow();
  });

  it("rejects loopback hosts by default", () => {
    expect(() => assertSafeLrsUrl("http://127.0.0.1/statements")).toThrow(/private or metadata host/);
    expect(() => assertSafeLrsUrl("http://169.254.169.254/latest/meta-data")).toThrow(
      /private or metadata host/,
    );
    expect(() => assertSafeLrsUrl("http://10.0.0.1/internal")).toThrow(/private or metadata host/);
  });

  it("allows private hosts when explicitly opted in", () => {
    expect(() =>
      assertSafeLrsUrl("http://127.0.0.1/statements", { allowPrivateHosts: true }),
    ).not.toThrow();
  });

  it("requires HTTPS in production builds", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => assertSafeLrsUrl("http://lrs.example/statements")).toThrow(/HTTPS is required/);
  });

  it("allows same-origin relative paths", () => {
    expect(() => assertSafeLrsUrl("/api/xapi/statements")).not.toThrow();
  });

  it("rejects protocol-relative URLs", () => {
    expect(() => assertSafeLrsUrl("//evil.com/xapi")).toThrow(/protocol-relative URLs are not allowed/);
    expect(() => assertSafeLrsUrl("//evil.com/xapi/statements")).toThrow(
      /protocol-relative URLs are not allowed/,
    );
  });

  it("rejects path traversal in relative URLs", () => {
    expect(() => assertSafeLrsUrl("/api/../secret")).toThrow(/path traversal/);
    expect(() => assertSafeLrsUrl("/api/%2e%2e/admin")).toThrow(/path traversal/);
  });

  it("rejects invalid URLs", () => {
    expect(() => assertSafeLrsUrl("not-a-url")).toThrow(/invalid URL/);
  });

  it("rejects unsupported schemes", () => {
    expect(() => assertSafeLrsUrl("javascript:alert(1)")).toThrow(/unsupported scheme/);
  });

  it("rejects additional private host ranges", () => {
    expect(() => assertSafeLrsUrl("http://172.16.0.1/internal")).toThrow(/private or metadata host/);
    expect(() => assertSafeLrsUrl("http://192.168.1.1/internal")).toThrow(/private or metadata host/);
    expect(() => assertSafeLrsUrl("http://[::1]/")).toThrow(/private or metadata host/);
    expect(() => assertSafeLrsUrl("http://[fe80::1]/")).toThrow(/private or metadata host/);
  });
});

describe("createFetchTransport URL guard", () => {
  it("rejects unsafe URLs at construction", () => {
    expect(() =>
      createFetchTransport({ url: "http://127.0.0.1/statements", retries: 0, timeoutMs: 0 }),
    ).toThrow(/private or metadata host/);
  });

  it("rejects unsafe batch sink URLs at construction", () => {
    expect(() =>
      createFetchBatchSink({ url: "http://169.254.169.254/", retries: 0, timeoutMs: 0 }),
    ).toThrow(/private or metadata host/);
  });

  it("rejects protocol-relative URLs at construction", () => {
    expect(() =>
      createFetchTransport({ url: "//evil.com/xapi", retries: 0, timeoutMs: 0 }),
    ).toThrow(/protocol-relative URLs are not allowed/);
    expect(() =>
      createFetchBatchSink({ url: "//evil.com/xapi", retries: 0, timeoutMs: 0 }),
    ).toThrow(/protocol-relative URLs are not allowed/);
  });
});

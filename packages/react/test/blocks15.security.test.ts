import { describe, expect, it, vi } from "vitest";
import {
  buildEmbedSandbox,
  isBlockedHost,
  resolveEmbedAspectRatio,
  resolveEmbedSrc,
  resolveMediaSrc,
  telemetryEmbedSrc,
} from "../src/blocks/embedSecurity";
import { chartMaxValue, normalizeChartData, normalizeChartType } from "../src/blocks/chartUtils";

describe("embedSecurity", () => {
  it("allows https embed URLs", () => {
    expect(resolveEmbedSrc("https://example.com/doc")).toBe("https://example.com/doc");
  });

  it("rejects javascript and data URLs", () => {
    expect(resolveEmbedSrc("javascript:alert(1)")).toBeNull();
    expect(resolveEmbedSrc("data:text/html,hello")).toBeNull();
    expect(resolveMediaSrc("javascript:alert(1)")).toBeNull();
  });

  it("blocks private-network hosts in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isBlockedHost("10.0.0.1")).toBe(true);
    expect(resolveEmbedSrc("https://10.0.0.1/doc")).toBeNull();
    expect(resolveMediaSrc("https://10.0.0.1/video.mp4")).toBeNull();
    vi.unstubAllEnvs();
  });

  it("allows explicitly allowlisted private hosts in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(
      resolveMediaSrc("https://10.0.0.1/video.mp4", { allowedHosts: ["10.0.0.1"] }),
    ).toBe("https://10.0.0.1/video.mp4");
    vi.unstubAllEnvs();
  });

  it("blocks high-risk sandbox tokens", () => {
    expect(buildEmbedSandbox("allow-top-navigation allow-forms")).toBe("allow-scripts allow-forms");
  });

  it("strips query strings from telemetry src", () => {
    expect(telemetryEmbedSrc("https://example.com/doc?token=secret")).toBe("https://example.com/doc");
  });

  it("strips credentials from telemetry src", () => {
    expect(telemetryEmbedSrc("https://user:secret@example.com/doc")).toBe("https://example.com/doc");
  });

  it("never allows popups-to-escape-sandbox", () => {
    expect(buildEmbedSandbox("allow-popups allow-popups-to-escape-sandbox")).toBe(
      "allow-scripts allow-popups",
    );
  });

  it("strips allow-popups in production when restricted", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(buildEmbedSandbox("allow-popups", { restrictPopupsInProduction: true })).toBe(
      "allow-scripts",
    );
    expect(buildEmbedSandbox("allow-popups", { restrictPopupsInProduction: false })).toBe(
      "allow-scripts allow-popups",
    );
    vi.unstubAllEnvs();
  });

  it("rejects invalid aspect ratio denominators", () => {
    expect(resolveEmbedAspectRatio("16 / 0")).toBeUndefined();
    expect(resolveEmbedAspectRatio("0 / 9")).toBeUndefined();
  });
});

describe("chartUtils", () => {
  it("normalizes invalid chart data safely", () => {
    expect(normalizeChartData(undefined)).toEqual([]);
    expect(normalizeChartData([{ label: "A", value: "bad" as unknown as number }])).toEqual([
      { label: "A", value: 0, key: "A-0" },
    ]);
  });

  it("clamps negative values to zero", () => {
    expect(normalizeChartData([{ label: "A", value: -5 }])).toEqual([
      { label: "A", value: 0, key: "A-0" },
    ]);
  });

  it("defaults unknown chart type to table", () => {
    expect(normalizeChartType("line")).toBe("table");
  });

  it("chartMaxValue avoids zero division", () => {
    expect(chartMaxValue([])).toBe(1);
    expect(chartMaxValue([{ label: "A", value: 0, key: "A-0" }])).toBe(1);
  });
});

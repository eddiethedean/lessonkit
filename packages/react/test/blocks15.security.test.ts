import { describe, expect, it } from "vitest";
import {
  buildEmbedSandbox,
  resolveEmbedAspectRatio,
  resolveEmbedSrc,
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
  });

  it("blocks high-risk sandbox tokens", () => {
    expect(buildEmbedSandbox("allow-top-navigation allow-forms")).toBe("allow-scripts allow-forms");
  });

  it("strips query strings from telemetry src", () => {
    expect(telemetryEmbedSrc("https://example.com/doc?token=secret")).toBe("https://example.com/doc");
  });

  it("validates aspect ratio format", () => {
    expect(resolveEmbedAspectRatio("16 / 9")).toBe("16 / 9");
    expect(resolveEmbedAspectRatio("not-a-ratio")).toBeUndefined();
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

  it("defaults unknown chart type to pie", () => {
    expect(normalizeChartType("line")).toBe("pie");
  });

  it("chartMaxValue avoids zero division", () => {
    expect(chartMaxValue([])).toBe(1);
    expect(chartMaxValue([{ label: "A", value: 0, key: "A-0" }])).toBe(1);
  });
});

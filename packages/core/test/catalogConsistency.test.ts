import { describe, expect, it } from "vitest";
import catalogV1Json from "../telemetry-catalog.v1.json";
import catalogV2Json from "../telemetry-catalog.v2.json";
import catalogV3Json from "../telemetry-catalog.v3.json";
import { TELEMETRY_EVENT_REGISTRY } from "../src/telemetry/eventRegistry";
import { buildTelemetryCatalog } from "../src/telemetryCatalog";
import { buildTelemetryCatalogV2 } from "../src/telemetryCatalogV2";
import { buildTelemetryCatalogV3 } from "../src/telemetryCatalogV3";

describe("telemetry catalog consistency", () => {
  it("telemetry-catalog.v1.json matches buildTelemetryCatalog()", () => {
    const catalog = catalogV1Json as { schemaVersion: number; entries: ReturnType<typeof buildTelemetryCatalog> };
    expect(catalog.schemaVersion).toBe(1);
    expect(catalog.entries).toEqual(buildTelemetryCatalog());
  });

  it("telemetry-catalog.v2.json matches buildTelemetryCatalogV2()", () => {
    const catalog = catalogV2Json as { schemaVersion: number; entries: ReturnType<typeof buildTelemetryCatalogV2> };
    expect(catalog.schemaVersion).toBe(2);
    expect(catalog.entries).toEqual(buildTelemetryCatalogV2());
  });

  it("telemetry-catalog.v3.json matches buildTelemetryCatalogV3()", () => {
    const catalog = catalogV3Json as { schemaVersion: number; entries: ReturnType<typeof buildTelemetryCatalogV3> };
    expect(catalog.schemaVersion).toBe(3);
    expect(catalog.entries).toEqual(buildTelemetryCatalogV3());
  });

  it("every event registry key is documented in a telemetry catalog", () => {
    const documented = new Set([
      ...buildTelemetryCatalog().map((e) => e.name),
      ...buildTelemetryCatalogV2().map((e) => e.name),
      ...buildTelemetryCatalogV3().map((e) => e.name),
    ]);
    const registryNames = Object.keys(TELEMETRY_EVENT_REGISTRY) as Array<
      keyof typeof TELEMETRY_EVENT_REGISTRY
    >;
    for (const name of registryNames) {
      expect(documented.has(name)).toBe(true);
    }
  });
});

import { describe, expect, it } from "vitest";
import catalogV3Json from "../block-catalog.v3.json";
import { buildBlockCatalog } from "../src/blockCatalog";

describe("block catalog consistency", () => {
  it("block-catalog.v3.json matches buildBlockCatalog({ version: 3 })", () => {
    const built = buildBlockCatalog({ version: 3 });
    const json = catalogV3Json as { schemaVersion: number; entries: typeof built };
    expect(json.schemaVersion).toBe(3);
    expect(json.entries).toEqual(built);
  });
});

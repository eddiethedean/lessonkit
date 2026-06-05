import { describe, expect, it } from "vitest";
import catalogJson from "../studio-block-catalog.v2.json";
import { buildStudioBlockCatalog } from "../src/catalog";
import { BLOCK_TYPES, STUDIO_BLOCK_REGISTRY } from "../src/blockRegistry";

describe("studio block registry vs catalog", () => {
  it("registry covers every catalog entry type", () => {
    const catalog = buildStudioBlockCatalog();
    for (const entry of catalog.entries) {
      expect(BLOCK_TYPES).toContain(entry.type);
      const reg = STUDIO_BLOCK_REGISTRY[entry.type as keyof typeof STUDIO_BLOCK_REGISTRY];
      expect(reg).toBeDefined();
      if (entry.displayName) {
        expect(entry.displayName).toBe(reg.displayName);
      }
    }
  });

  it("buildStudioBlockCatalog matches studio-block-catalog.v2.json", () => {
    expect(buildStudioBlockCatalog()).toEqual(catalogJson);
  });
});

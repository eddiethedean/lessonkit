import { describe, expect, it } from "vitest";
import { runBlocksList } from "../src/commands/blocks.js";

describe("runBlocksList", () => {
  it("returns TSV text when json is false", async () => {
    const result = await runBlocksList({});
    expect(result.ok).toBe(true);
    if (result.ok && result.command === "blocks list") {
      expect(result.text).toContain("type\tcategory\th5pMachineName");
      expect(result.text).toContain("TrueFalse");
      expect(result.count).toBeGreaterThan(40);
    }
  });

  it("filters by category", async () => {
    const result = await runBlocksList({ json: true, category: "container" });
    expect(result.ok).toBe(true);
    if (result.ok && result.command === "blocks list" && result.entries) {
      expect(result.entries.length).toBeGreaterThan(0);
      expect(result.entries.every((e) => e.category === "container")).toBe(true);
    }
  });
});

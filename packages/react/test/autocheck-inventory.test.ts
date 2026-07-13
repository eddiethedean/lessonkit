/**
 * Guardrail: only FillInTheBlanks and DragTheWords implement autoCheck today.
 * Catalog may advertise AssessmentBehaviour.autoCheck more broadly — runtime
 * stale-pass regressions must stay anchored to real implementations.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const BLOCKS_DIR = join(import.meta.dirname, "../src/blocks");
const COMPONENTS_DIR = join(import.meta.dirname, "../src/components");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".tsx") || name.endsWith(".ts"))
    .map((name) => join(dir, name));
}

describe("autoCheck implementation inventory", () => {
  it("only FillInTheBlanks and DragTheWords reference props.autoCheck in source", () => {
    const files = [...sourceFiles(BLOCKS_DIR), ...sourceFiles(COMPONENTS_DIR)];
    const hits: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      if (/\bprops\.autoCheck\b|\bautoCheck\s*&&/.test(source) && /autoCheck/.test(source)) {
        // Prefer explicit props.autoCheck / autoCheck usage in logic, not type-only props.
        if (/props\.autoCheck|\bautoCheck\s*&&|autoCheck\s*\?/.test(source)) {
          hits.push(file.split("/").pop()!);
        }
      }
    }
    expect(hits.sort()).toEqual(["DragTheWords.tsx", "FillInTheBlanks.tsx"]);
  });
});

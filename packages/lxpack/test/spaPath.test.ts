import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { assertResolvedPathUnderRoot, isSafeRelativeSpaPath } from "../src/spaPath";

describe("spaPath", () => {
  it("allows ./dist style relative paths", () => {
    expect(isSafeRelativeSpaPath("./dist")).toBe(true);
  });

  it("rejects parent segments", () => {
    expect(isSafeRelativeSpaPath("../dist")).toBe(false);
  });

  it("rejects Windows drive-relative and absolute drive paths", () => {
    expect(isSafeRelativeSpaPath("C:foo")).toBe(false);
    expect(isSafeRelativeSpaPath("C:")).toBe(false);
    expect(isSafeRelativeSpaPath("C:\\dist")).toBe(false);
    expect(isSafeRelativeSpaPath("C:/dist")).toBe(false);
  });

  it("assertResolvedPathUnderRoot throws when target escapes root", () => {
    const root = resolve("/tmp/project");
    expect(() => assertResolvedPathUnderRoot(root, resolve("/tmp/other"))).toThrow(
      /unsafe path escapes project root/,
    );
  });
});

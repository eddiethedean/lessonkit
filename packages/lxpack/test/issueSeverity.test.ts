import { describe, expect, it } from "vitest";
import { findPackagingErrorIssues, isPackagingErrorIssue } from "../src/packaging/issueSeverity";

describe("issueSeverity", () => {
  it("treats error and fatal as packaging errors", () => {
    expect(isPackagingErrorIssue({ severity: "error" })).toBe(true);
    expect(isPackagingErrorIssue({ severity: "FATAL" })).toBe(true);
  });

  it("ignores warnings and missing severity", () => {
    expect(isPackagingErrorIssue({ severity: "warning" })).toBe(false);
    expect(isPackagingErrorIssue({ severity: "info" })).toBe(false);
    expect(isPackagingErrorIssue({})).toBe(false);
  });

  it("findPackagingErrorIssues filters mixed lists", () => {
    const issues = [
      { severity: "warning", message: "a" },
      { severity: "error", message: "b" },
      { severity: "info", message: "c" },
      { severity: "fatal", message: "d" },
    ];
    expect(findPackagingErrorIssues(issues)).toEqual([
      { severity: "error", message: "b" },
      { severity: "fatal", message: "d" },
    ]);
  });

  it("returns empty array for undefined input", () => {
    expect(findPackagingErrorIssues(undefined)).toEqual([]);
  });
});

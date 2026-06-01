import type { StudioValidationIssue } from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function pushIssue(issues: StudioValidationIssue[], path: string, message: string): void {
  issues.push({ path, message });
}

export function parseString(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
  { required = true, trim = true }: { required?: boolean; trim?: boolean } = {},
): string | undefined {
  if (raw === undefined || raw === null) {
    if (required) pushIssue(issues, path, "must be a string");
    return undefined;
  }
  if (typeof raw !== "string") {
    pushIssue(issues, path, "must be a string");
    return undefined;
  }
  const value = trim ? raw.trim() : raw;
  if (!value.length && required) {
    pushIssue(issues, path, "must not be empty");
    return undefined;
  }
  return value;
}

export function parsePositiveInt(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
  allowed: readonly number[],
): number | undefined {
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    pushIssue(issues, path, `must be one of ${allowed.join(", ")}`);
    return undefined;
  }
  if (!allowed.includes(raw)) {
    pushIssue(issues, path, `must be one of ${allowed.join(", ")}`);
    return undefined;
  }
  return raw;
}

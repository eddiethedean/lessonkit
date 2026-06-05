import type { StudioValidationIssue } from "../types";

export function pushIssue(issues: StudioValidationIssue[], path: string, message: string): void {
  issues.push({ path, message });
}

export function parseBoolean(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): boolean | undefined {
  if (typeof raw === "boolean") return raw;
  if (raw === "true") return true;
  if (raw === "false") return false;
  pushIssue(issues, path, "must be a boolean");
  return undefined;
}

export function parseNumber(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  pushIssue(issues, path, "must be a number");
  return undefined;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

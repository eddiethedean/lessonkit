export type PackagingIssueLike = { severity?: string; path?: string; message?: string };

export function isPackagingErrorIssue(issue: PackagingIssueLike): boolean {
  const severity = issue.severity?.toLowerCase();
  return severity === "error" || severity === "fatal";
}

export function findPackagingErrorIssues(
  issues: PackagingIssueLike[] | undefined,
): PackagingIssueLike[] {
  return (issues ?? []).filter(isPackagingErrorIssue);
}

export function isPackagingWarningIssue(issue: PackagingIssueLike): boolean {
  return issue.severity?.toLowerCase() === "warning";
}

export function findPackagingWarningIssues(
  issues: PackagingIssueLike[] | undefined,
): PackagingIssueLike[] {
  return (issues ?? []).filter(isPackagingWarningIssue);
}

export type PackagingIssueLike = { severity?: string };

export function isPackagingErrorIssue(issue: PackagingIssueLike): boolean {
  const severity = issue.severity?.toLowerCase();
  return severity === "error" || severity === "fatal";
}

export function findPackagingErrorIssues(
  issues: PackagingIssueLike[] | undefined,
): PackagingIssueLike[] {
  return (issues ?? []).filter(isPackagingErrorIssue);
}

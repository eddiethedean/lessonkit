/** Shared validation issue shape across lxpack parsers. */
export type ValidationIssue = {
  path: string;
  message: string;
  severity?: string;
};

export const EXIT_SUCCESS = 0;
export const EXIT_RUNTIME = 1;
export const EXIT_INVALID_PROJECT = 2;
export const EXIT_PACKAGING = 3;

export type CliIssue = {
  path?: string;
  message: string;
  severity?: string;
};

export type CliErrorCode =
  | "RUNTIME"
  | "INVALID_PROJECT"
  | "PACKAGING"
  | "NODE_VERSION"
  | "TARGET_REQUIRED";

export class CliError extends Error {
  readonly code: CliErrorCode;
  readonly exitCode: number;
  readonly issues?: CliIssue[];

  constructor(
    message: string,
    opts: { code: CliErrorCode; exitCode: number; issues?: CliIssue[] },
  ) {
    super(message);
    this.name = "CliError";
    this.code = opts.code;
    this.exitCode = opts.exitCode;
    this.issues = opts.issues;
  }
}

export type CliJsonResult =
  | {
      ok: true;
      command?: string;
      target?: string;
      projectRoot?: string;
      outputPath?: string;
      outputDir?: string;
      distDir?: string;
      fileCount?: number;
    }
  | {
      ok: false;
      code: CliErrorCode;
      message: string;
      exitCode: number;
      issues?: CliIssue[];
    };

export function formatCliError(error: unknown): { message: string; exitCode: number; json: CliJsonResult } {
  if (error instanceof CliError) {
    const json: CliJsonResult = {
      ok: false,
      code: error.code,
      message: error.message,
      exitCode: error.exitCode,
      issues: error.issues,
    };
    let message = error.message;
    if (error.issues?.length) {
      const details = error.issues.map((i) => (i.path ? `${i.path}: ${i.message}` : i.message)).join("\n");
      message = `${error.message}\n${details}`;
    }
    return { message, exitCode: error.exitCode, json };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    message,
    exitCode: EXIT_RUNTIME,
    json: { ok: false, code: "RUNTIME", message, exitCode: EXIT_RUNTIME },
  };
}

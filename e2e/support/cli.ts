import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { CLI_BIN, REPO_ROOT } from "./paths.js";

export type RunCliResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

export function ensureCliBuilt(): void {
  if (existsSync(CLI_BIN)) {
    return;
  }
  execSync("npm run build:packages", { cwd: REPO_ROOT, stdio: "inherit" });
  execSync("npm run -w @lessonkit/cli build", { cwd: REPO_ROOT, stdio: "inherit" });
}

export function runCli(args: string[], cwd: string): RunCliResult {
  ensureCliBuilt();
  if (!existsSync(CLI_BIN)) {
    throw new Error(`CLI not built at ${CLI_BIN}`);
  }

  const result = spawnSync(process.execPath, [CLI_BIN, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 300_000,
  });

  return {
    exitCode: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function parseCliJson<T>(stdout: string): T {
  const lines = stdout
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]!;
    if (line.startsWith("{")) {
      return JSON.parse(line) as T;
    }
  }
  throw new Error(`No JSON line in CLI stdout:\n${stdout}`);
}

export function runCliJson<T extends { ok: boolean }>(
  args: string[],
  cwd: string,
): { result: RunCliResult; json: T } {
  const jsonArgs = args.includes("--json") ? args : [...args, "--json"];
  const result = runCli(jsonArgs, cwd);
  const json = parseCliJson<T>(result.stdout);
  return { result, json };
}

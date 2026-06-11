import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { CLI_BIN, REPO_ROOT } from "./paths.js";

export type RunCliOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
};

export type RunCliResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

export function runCli(args: string[], opts: RunCliOptions = {}): RunCliResult {
  if (!existsSync(CLI_BIN)) {
    throw new Error(`CLI not built at ${CLI_BIN}. Run: npm run build:packages && npm run -w @lessonkit/cli build`);
  }

  const result = spawnSync(process.execPath, [CLI_BIN, ...args], {
    cwd: opts.cwd ?? REPO_ROOT,
    env: { ...process.env, ...opts.env },
    encoding: "utf8",
    timeout: opts.timeoutMs ?? 300_000,
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
  opts: RunCliOptions = {},
): { result: RunCliResult; json: T } {
  const jsonArgs = args.includes("--json") ? args : [...args, "--json"];
  const result = runCli(jsonArgs, opts);
  const json = parseCliJson<T>(result.stdout);
  return { result, json };
}

export function runNpm(args: string[], opts: RunCliOptions = {}): RunCliResult {
  const result = spawnSync("npm", args, {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    encoding: "utf8",
    timeout: opts.timeoutMs ?? 300_000,
    stdio: ["ignore", "pipe", "pipe"],
  });

  return {
    exitCode: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

let packagesBuilt = process.env.LK_INTEGRATION_PACKAGES_BUILT === "1";

export function ensurePackagesBuilt(): void {
  if (packagesBuilt && existsSync(CLI_BIN)) return;
  execSync("npm run build:packages", { cwd: REPO_ROOT, stdio: "inherit" });
  execSync("npm run -w @lessonkit/cli build", { cwd: REPO_ROOT, stdio: "inherit" });
  packagesBuilt = true;
  process.env.LK_INTEGRATION_PACKAGES_BUILT = "1";
}

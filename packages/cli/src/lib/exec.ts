import { spawn } from "node:child_process";
import { CliError, EXIT_RUNTIME } from "./errors.js";

const DEFAULT_CMD_TIMEOUT_MS = 30 * 60 * 1000;

function resolveCommandTimeoutMs(explicit?: number): number | undefined {
  if (explicit !== undefined) {
    return explicit > 0 ? explicit : undefined;
  }
  const raw = process.env.LESSONKIT_CMD_TIMEOUT_MS;
  if (raw === undefined || raw === "") return DEFAULT_CMD_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_CMD_TIMEOUT_MS;
  return parsed;
}

export type RunCommandOptions = {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  /** Subprocess timeout in ms (default from LESSONKIT_CMD_TIMEOUT_MS or 30 minutes). Set 0 to disable. */
  timeoutMs?: number;
};

export async function runCommand(
  command: string,
  args: string[],
  opts: RunCommandOptions,
): Promise<void> {
  const timeoutMs = resolveCommandTimeoutMs(opts.timeoutMs);

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: opts.cwd,
      env: opts.env ?? process.env,
      stdio: "inherit",
      shell: false,
    });

    let timedOut = false;
    const timer =
      timeoutMs !== undefined
        ? setTimeout(() => {
            timedOut = true;
            child.kill("SIGTERM");
            setTimeout(() => child.kill("SIGKILL"), 5000).unref?.();
          }, timeoutMs)
        : undefined;

    const settle = (fn: () => void) => {
      if (timer !== undefined) clearTimeout(timer);
      fn();
    };

    child.on("error", (err) => {
      settle(() => {
        rejectPromise(
          new CliError(`Failed to run ${command}: ${err.message}`, {
            code: "RUNTIME",
            exitCode: EXIT_RUNTIME,
          }),
        );
      });
    });

    child.on("close", (code) => {
      settle(() => {
        if (timedOut) {
          rejectPromise(
            new CliError(`${command} timed out after ${timeoutMs}ms.`, {
              code: "RUNTIME",
              exitCode: EXIT_RUNTIME,
            }),
          );
          return;
        }
        if (code === 0) {
          resolvePromise();
          return;
        }
        rejectPromise(
          new CliError(`${command} exited with code ${code ?? "unknown"}.`, {
            code: "RUNTIME",
            exitCode: EXIT_RUNTIME,
          }),
        );
      });
    });
  });
}

export async function runNpmInstall(cwd: string): Promise<void> {
  await runCommand("npm", ["install"], { cwd });
}

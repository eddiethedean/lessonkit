import { spawn } from "node:child_process";
import { CliError, EXIT_RUNTIME } from "./errors.js";

export type RunCommandOptions = {
  cwd: string;
  env?: NodeJS.ProcessEnv;
};

export async function runCommand(
  command: string,
  args: string[],
  opts: RunCommandOptions,
): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: opts.cwd,
      env: opts.env ?? process.env,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", (err) => {
      rejectPromise(
        new CliError(`Failed to run ${command}: ${err.message}`, {
          code: "RUNTIME",
          exitCode: EXIT_RUNTIME,
        }),
      );
    });

    child.on("close", (code) => {
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
}

export async function runNpmInstall(cwd: string): Promise<void> {
  await runCommand("npm", ["install"], { cwd });
}

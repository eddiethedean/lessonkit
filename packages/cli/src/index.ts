import { createRequire } from "node:module";
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runBuild, runDev } from "./commands/dev.js";
import { runPackage } from "./commands/package.js";
import { formatCliError } from "./lib/errors.js";
import type { CliLogger } from "./lib/logger.js";
import { createLogger } from "./lib/logger.js";
import { PACKAGE_TARGETS } from "./lib/paths.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

export type { CliLogger } from "./lib/logger.js";

async function handleCommand(
  fn: () => Promise<{ ok: boolean } & Record<string, unknown>>,
  logger: CliLogger,
  json: boolean,
): Promise<void> {
  try {
    const result = await fn();
    if (json) {
      console.log(JSON.stringify(result));
    }
  } catch (error) {
    const formatted = formatCliError(error);
    if (json) {
      console.log(JSON.stringify(formatted.json));
    } else {
      logger.error(formatted.message);
    }
    process.exitCode = formatted.exitCode;
  }
}

export function createProgram(baseLogger: CliLogger = console): Command {
  const program = new Command();

  program.name("lessonkit").description("LessonKit CLI").version(version);

  program
    .command("init")
    .description("Initialize a LessonKit project from the Vite + React template")
    .argument("[name]", "Project directory name")
    .option("--here", "Initialize in the current directory")
    .option("--skip-install", "Skip npm install")
    .option("--force", "Initialize into a non-empty directory")
    .option("--json", "Emit structured JSON result")
    .action(async (name: string | undefined, opts: { here?: boolean; skipInstall?: boolean; force?: boolean; json?: boolean }) => {
      const logger = createLogger({ json: opts.json });
      await handleCommand(
        () => runInit({ name, here: opts.here, skipInstall: opts.skipInstall, force: opts.force, json: opts.json }, logger),
        logger,
        Boolean(opts.json),
      );
    });

  const addCwdAndJson = (cmd: Command) =>
    cmd.option("--cwd <dir>", "Project root directory").option("--json", "Emit structured JSON result");

  addCwdAndJson(
    program
      .command("dev")
      .description("Run the Vite dev server")
      .allowUnknownOption()
      .allowExcessArguments(),
  ).action(async (opts: { cwd?: string; json?: boolean }, command: Command) => {
    const logger = createLogger({ json: opts.json });
    const viteArgs = command.args;
    await handleCommand(
      () => runDev({ cwd: opts.cwd, json: opts.json, viteArgs }),
      logger,
      Boolean(opts.json),
    );
  });

  addCwdAndJson(program.command("build").description("Production Vite build")).action(
    async (opts: { cwd?: string; json?: boolean }, command: Command) => {
      const logger = createLogger({ json: opts.json });
      const viteArgs = command.args;
      await handleCommand(
        () => runBuild({ cwd: opts.cwd, json: opts.json, viteArgs }),
        logger,
        Boolean(opts.json),
      );
    },
  );

  program
    .command("package")
    .description("Build or package for web / LMS delivery")
    .requiredOption("--target <target>", `Export target (${PACKAGE_TARGETS.join(", ")})`)
    .option("--cwd <dir>", "Project root directory")
    .option("--no-build", "Skip implicit Vite build for LMS targets")
    .option("--out <path>", "Override output artifact path")
    .option("--json", "Emit structured JSON result")
    .action(async (opts: { target: string; cwd?: string; build?: boolean; out?: string; json?: boolean }) => {
      const logger = createLogger({ json: opts.json });
      await handleCommand(
        () =>
          runPackage({
            target: opts.target,
            cwd: opts.cwd,
            noBuild: opts.build === false,
            out: opts.out,
            json: opts.json,
          }),
        logger,
        Boolean(opts.json),
      );
    });

  program
    .command("publish")
    .description("Publish package artifacts (stub)")
    .action(() => {
      baseLogger.log("lessonkit publish is not implemented. See RELEASING.md for npm publish workflow.");
    });

  return program;
}

export async function run(argv: string[] = process.argv, logger: CliLogger = console): Promise<void> {
  const program = createProgram(logger);
  await program.parseAsync(argv);
}

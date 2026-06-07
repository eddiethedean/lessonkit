import { createRequire } from "node:module";
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runBuild, runDev } from "./commands/dev.js";
import { runPackage } from "./commands/package.js";
import { formatCliError, type CliJsonResult } from "./lib/errors.js";
import type { CliLogger } from "./lib/logger.js";
import { createLogger } from "./lib/logger.js";
import { PACKAGE_TARGETS } from "./lib/paths.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

export type { CliLogger } from "./lib/logger.js";

async function handleCommand<T extends CliJsonResult>(
  fn: () => Promise<T>,
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

/**
 * Build the Commander program used by the `lessonkit` CLI binary.
 * Useful for embedding init/build/package in Node scripts and tests.
 */
export function createProgram(baseLogger: CliLogger = console): Command {
  const program = new Command();

  program.name("lessonkit").description("LessonKit CLI").version(version);

  program
    .command("init")
    .description("Initialize a LessonKit project from the Vite + React template")
    .argument("[name]", "Project directory name")
    .option("--here", "Initialize in the current directory")
    .option("--skip-install", "Skip npm install")
    .option(
      "--force",
      "Requires --here: allow init when the directory is empty or contains only dotfiles",
    )
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

  addCwdAndJson(
    program
      .command("build")
      .description("Production Vite build")
      .allowUnknownOption()
      .allowExcessArguments(),
  ).action(
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
    .option("--strict-parity", "Treat React ID parity warnings as packaging errors")
    .option("--json", "Emit structured JSON result")
    .action(async (opts: { target: string; cwd?: string; build?: boolean; out?: string; json?: boolean; strictParity?: boolean }) => {
      const logger = createLogger({ json: opts.json });
      await handleCommand(
        async () => {
          const result = await runPackage({
            target: opts.target,
            cwd: opts.cwd,
            noBuild: opts.build === false,
            out: opts.out,
            json: opts.json,
            strictParity: opts.strictParity,
          });
          if (!opts.json && result.ok && result.command === "package") {
            if (result.target === "react-vite") {
              logger.log(`Built react-vite → ${result.distDir}`);
            } else {
              const dest = result.outputPath ?? result.outputDir;
              logger.log(
                `Packaged ${result.target}${dest ? ` → ${dest}` : ""} (${result.fileCount} files)`,
              );
            }
          }
          return result;
        },
        logger,
        Boolean(opts.json),
      );
    });

  program
    .command("publish")
    .description("[maintainers] Not implemented — use Changesets (see RELEASING.md)")
    .action(() => {
      baseLogger.log(
        "lessonkit publish is not implemented. Monorepo releases use Changesets: npm run changeset && npm run version-packages && npm run release. See RELEASING.md.",
      );
    });

  return program;
}

/**
 * Parse argv and run the LessonKit CLI (same as the `lessonkit` binary entrypoint).
 */
export async function run(argv: string[] = process.argv, logger: CliLogger = console): Promise<void> {
  const program = createProgram(logger);
  await program.parseAsync(argv);
}

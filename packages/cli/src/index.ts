import { createRequire } from "node:module";
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runBuild, runDev } from "./commands/dev.js";
import { runPackage } from "./commands/package.js";
import { runExport } from "./commands/export.js";
import { runBlocksList } from "./commands/blocks.js";
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
      "With --here: scaffold in a non-empty directory; back up conflicting template paths under .lessonkit-init-backup/ before overwrite",
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
    .option("--strict", "Treat Vite build warnings as packaging failures")
    .option("--json", "Emit structured JSON result")
    .action(async (opts: { target: string; cwd?: string; build?: boolean; out?: string; json?: boolean; strictParity?: boolean; strict?: boolean }) => {
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
            strict: opts.strict,
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

  addCwdAndJson(
    program
      .command("export")
      .description("Export a portable .lkcourse archive (manifest + interchange + dist)")
      .option("--out <path>", "Output .lkcourse path (relative to project root)")
      .option("--no-build", "Skip implicit Vite build")
      .option("--with-block-tree", "Include optional block-tree.json from src scan"),
  ).action(async (opts: { cwd?: string; out?: string; build?: boolean; withBlockTree?: boolean; json?: boolean }) => {
    const logger = createLogger({ json: opts.json });
    await handleCommand(
      async () => {
        const result = await runExport({
          cwd: opts.cwd,
          out: opts.out,
          noBuild: opts.build === false,
          withBlockTree: opts.withBlockTree,
          json: opts.json,
        });
        if (!opts.json && result.ok && result.command === "export") {
          logger.log(`Exported .lkcourse → ${result.archivePath} (${result.fileCount} files)`);
        }
        return result;
      },
      logger,
      Boolean(opts.json),
    );
  });

  program
    .command("blocks")
    .description("Block registry commands")
    .command("list")
    .description("List runtime blocks from block-catalog.v3.json")
    .option("--json", "Emit structured JSON result")
    .option("--category <category>", "Filter by category (container, assessment, content, compound)")
    .option("--tier <tier>", "Filter by tier (A, B, C, D, E)")
    .action(async (opts: { json?: boolean; category?: string; tier?: string }) => {
      const logger = createLogger({ json: opts.json });
      await handleCommand(
        async () => {
          const result = await runBlocksList({
            json: opts.json,
            category: opts.category,
            tier: opts.tier,
          });
          if (!opts.json && result.ok && "text" in result && typeof result.text === "string") {
            logger.log(result.text);
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

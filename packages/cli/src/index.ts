import { createRequire } from "node:module";
import { Command } from "commander";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

export type CliLogger = {
  log: (...args: unknown[]) => void;
};

export function createProgram(logger: CliLogger = console): Command {
  const program = new Command();

  program.name("lessonkit").description("LessonKit CLI").version(version);

  program
    .command("init")
    .description("Initialize a LessonKit project (stub)")
    .action(() => {
      logger.log("lessonkit init (coming soon)");
    });

  program
    .command("dev")
    .description("Run a LessonKit project in dev mode (stub)")
    .action(() => {
      logger.log("lessonkit dev (coming soon)");
    });

  program
    .command("build")
    .description("Build a LessonKit project (stub)")
    .action(() => {
      logger.log("lessonkit build (coming soon)");
    });

  program
    .command("package")
    .description("Package to SCORM/xAPI formats (stub)")
    .action(() => {
      logger.log("lessonkit package (coming soon)");
    });

  program
    .command("publish")
    .description("Publish package artifacts (stub)")
    .action(() => {
      logger.log("lessonkit publish (coming soon)");
    });

  return program;
}

export async function run(argv: string[] = process.argv, logger: CliLogger = console): Promise<void> {
  const program = createProgram(logger);
  await program.parseAsync(argv);
}


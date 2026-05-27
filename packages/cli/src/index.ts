#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program.name("lessonkit").description("LessonKit CLI").version("0.0.0");

program
  .command("init")
  .description("Initialize a LessonKit project (stub)")
  .action(() => {
    console.log("lessonkit init (coming soon)");
  });

program
  .command("dev")
  .description("Run a LessonKit project in dev mode (stub)")
  .action(() => {
    console.log("lessonkit dev (coming soon)");
  });

program
  .command("build")
  .description("Build a LessonKit project (stub)")
  .action(() => {
    console.log("lessonkit build (coming soon)");
  });

program
  .command("package")
  .description("Package to SCORM/xAPI formats (stub)")
  .action(() => {
    console.log("lessonkit package (coming soon)");
  });

program
  .command("publish")
  .description("Publish package artifacts (stub)")
  .action(() => {
    console.log("lessonkit publish (coming soon)");
  });

program.parse(process.argv);


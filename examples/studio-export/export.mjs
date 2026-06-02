import { mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeReactViteProject } from "@lessonkit/studio-codegen/node";

const ROOT = join(dirname(fileURLToPath(import.meta.url)));
const FIXTURE = join(ROOT, "../../integration/fixtures/studio-export/project.json");
const OUT = join(ROOT, "out/studio-export-demo");

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const raw = JSON.parse(await readFile(FIXTURE, "utf8"));
const { loadStudioProject } = await import("@lessonkit/studio-schema");
const loaded = loadStudioProject(raw);
if (!loaded.ok) {
  throw new Error(JSON.stringify(loaded.issues));
}

await writeReactViteProject(loaded.project, {
  outDir: OUT,
  exportMode: "renderer",
  lessonkitVersion: "1.0.2",
  studioVersion: "0.3.0",
});

console.log(`Wrote React/Vite project to ${OUT}`);

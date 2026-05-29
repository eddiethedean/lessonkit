#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const goldenDir = join(repoRoot, "examples/lxpack-golden");

execSync("npm run build:packages", { cwd: repoRoot, stdio: "inherit" });
execSync("npm run build -w lessonkit-example-lxpack-golden", { cwd: repoRoot, stdio: "inherit" });

const targets = process.env.CONFORMANCE_TARGETS?.split(",") ?? ["standalone", "scorm12"];
const results = [];

for (const target of targets) {
  try {
    if (target === "standalone") {
      execSync("npm run package:standalone -w lessonkit-example-lxpack-golden", {
        cwd: repoRoot,
        stdio: "inherit",
      });
      const dir = join(goldenDir, ".lxpack/course/.lxpack/out/standalone");
      results.push({ target, ok: existsSync(dir), path: dir });
    } else if (target === "scorm12") {
      execSync("npm run package:scorm12 -w lessonkit-example-lxpack-golden", {
        cwd: repoRoot,
        stdio: "inherit",
      });
      const zip = join(goldenDir, ".lxpack/course/.lxpack/out/course-scorm12.zip");
      results.push({ target, ok: existsSync(zip), path: zip });
    } else {
      execSync(
        `node packages/cli/dist/bin.js package --target ${target} --no-build`,
        { cwd: join(goldenDir), stdio: "inherit" },
      );
      results.push({ target, ok: true });
    }
  } catch (err) {
    results.push({
      target,
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

const ok = results.every((r) => r.ok);
console.log(JSON.stringify({ ok, results }, null, 2));
process.exit(ok ? 0 : 1);

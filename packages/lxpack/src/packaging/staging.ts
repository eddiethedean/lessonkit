import * as fsp from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { packageLessonkit, type BuildCourseResult, type ExportTarget } from "@lxpack/api";
import type { LessonkitCourseDescriptor } from "../types";
import { descriptorToInterchange } from "../interchange";
import { resolveSpaDirs } from "../spaDirs";
import type { WriteLxpackProjectOptions } from "../writeProject";

export type BuildStagingPackageOptions = WriteLxpackProjectOptions & {
  descriptor: LessonkitCourseDescriptor;
  target: ExportTarget;
  output?: string;
  dir?: boolean;
  outputBaseDir?: string;
};

export type BuildStagingPackageResult =
  | {
      ok: true;
      stagingDir: string;
      build: Extract<BuildCourseResult, { ok: true }>;
      outputPath?: string;
      outputDir?: string;
    }
  | {
      ok: false;
      stagingDir: string;
      issues: Array<{ path?: string; message: string; severity?: string }>;
      build?: BuildCourseResult;
    };

export async function buildStagingPackage(
  options: BuildStagingPackageOptions,
): Promise<BuildStagingPackageResult> {
  const { target, output, dir, outputBaseDir, descriptor, ...writeOpts } = options;
  const stagingDir = await fsp.mkdtemp(join(tmpdir(), "lessonkit-lxpack-"));

  try {
    let spaDirs: Record<string, string>;
    try {
      spaDirs = await resolveSpaDirs({ ...writeOpts, descriptor });
    } catch (err) {
      return {
        ok: false,
        stagingDir,
        issues: [
          {
            path: "spaDirs",
            message: err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }

    const interchange = descriptorToInterchange(descriptor);
    const outputBase = outputBaseDir ?? ".lxpack/out";
    await fsp.mkdir(join(stagingDir, outputBase), { recursive: true });
    const defaultOutput =
      output ?? (dir ? join(outputBase, target) : join(outputBase, `course-${target}.zip`));

    const build = await packageLessonkit({
      interchange,
      spaDirs,
      target,
      courseDir: stagingDir,
      output: defaultOutput,
      dir,
      outputBaseDir,
      outputAnchorDir: stagingDir,
      writeAuthoringFiles: true,
    });

    if (!build.ok) {
      return {
        ok: false,
        stagingDir,
        build,
        issues: build.issues.map((i) => ({
          path: i.path,
          message: i.message,
          severity: i.severity,
        })),
      };
    }

    return {
      ok: true,
      stagingDir,
      build,
      outputPath: "outputPath" in build ? build.outputPath : undefined,
      outputDir: "outputDir" in build ? build.outputDir : undefined,
    };
  } catch (err) {
    await fsp.rm(stagingDir, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
    throw err;
  }
}

export async function ensureOutDirParent(outDir: string): Promise<void> {
  await fsp.mkdir(dirname(outDir), { recursive: true });
}

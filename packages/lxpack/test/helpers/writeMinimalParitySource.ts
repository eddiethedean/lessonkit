import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Minimal React source so validateReactManifestParity passes in packaging tests. */
export async function writeMinimalParitySource(
  projectRoot: string,
  descriptor: {
    courseId: string;
    lessons?: Array<{ id?: string }>;
    assessments?: Array<{ checkId?: string }>;
  },
): Promise<void> {
  const srcDir = join(projectRoot, "src");
  await mkdir(srcDir, { recursive: true });
  const checks = (descriptor.assessments ?? [])
    .filter((a) => a.checkId)
    .map((a) => `<Quiz checkId="${a.checkId}" />`)
    .join("\n");
  const lessonId = descriptor.lessons?.[0]?.id;
  const body = lessonId
    ? `<Lesson lessonId="${lessonId}">\n${checks}\n</Lesson>`
    : checks;
  await writeFile(
    join(srcDir, "App.tsx"),
    `<Course courseId="${descriptor.courseId}">\n${body}\n</Course>`,
    "utf-8",
  );
}

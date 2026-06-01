import React, { useMemo } from "react";
import type { LessonId } from "@lessonkit/core";
import { validateStudioProject, type StudioProjectV1 } from "@lessonkit/studio-schema";
import { Course, Lesson, ThemeProvider, type LessonkitConfig } from "@lessonkit/react";
import type { ThemePresetName } from "@lessonkit/themes";
import { renderPageBlocks } from "./renderBlock";

function isDevEnvironment(): boolean {
  return typeof process !== "undefined" && process.env.NODE_ENV !== "production";
}

export type StudioRendererProps = {
  project: StudioProjectV1;
  config?: Omit<LessonkitConfig, "courseId">;
  theme?: { preset?: ThemePresetName; mode?: "light" | "dark" };
  activePageId?: LessonId;
  className?: string;
};

export function StudioRenderer({
  project,
  config,
  theme,
  activePageId,
  className,
}: StudioRendererProps) {
  const pages = useMemo(() => {
    if (!activePageId) return project.pages;
    return project.pages.filter((p) => p.id === activePageId);
  }, [project.pages, activePageId]);

  const devValidation = useMemo(() => {
    if (!isDevEnvironment()) return null;
    return validateStudioProject(project);
  }, [project]);

  if (devValidation && !devValidation.ok) {
    console.warn(
      "[lessonkit-studio] StudioRenderer project validation issues:",
      devValidation.issues,
    );
    return (
      <div className={className} role="alert">
        <p>Invalid Studio project (development validation).</p>
        <ul>
          {devValidation.issues.map((issue) => (
            <li key={`${issue.path}:${issue.message}`}>
              {issue.path}: {issue.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (activePageId && pages.length === 0) {
    return (
      <div className={className} role="alert">
        Unknown activePageId: {activePageId}
      </div>
    );
  }

  const preset = theme?.preset ?? "default";
  const mode = theme?.mode ?? "light";

  return (
    <ThemeProvider preset={preset} mode={mode}>
      <div className={className ?? "lk-studio-root"}>
        <Course title={project.course.title} courseId={project.course.courseId} config={config}>
          {pages.map((page) => (
            <Lesson key={page.id} title={page.title} lessonId={page.id}>
              {renderPageBlocks(page.blocks)}
            </Lesson>
          ))}
        </Course>
      </div>
    </ThemeProvider>
  );
}

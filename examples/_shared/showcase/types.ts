import type { TelemetryEvent } from "@lessonkit/core";
import type { ThemeMode } from "@lessonkit/react";
import type { XAPIStatement } from "@lessonkit/xapi";
import type { ReactNode } from "react";
import type { LessonMeta } from "../course-ui";

export type ShowcaseLessonMeta = LessonMeta & {
  blocks: readonly string[];
};

export type ShowcaseMeta = {
  courseId: string;
  courseTitle: string;
  topbarTitle: string;
  subtitle: string;
  sidebarTitle: string;
  estimate: string;
  frameworkChip: string;
  secondaryChip: string;
  themeClassName: string;
  lessons: readonly ShowcaseLessonMeta[];
  sibling: {
    label: string;
    npmCommand: string;
  };
  courseConfig: {
    session?: {
      persistCompoundState?: boolean;
    };
    tracking: {
      sink: (event: TelemetryEvent) => void;
    };
    xapi: {
      transport: (statement: XAPIStatement) => void;
    };
  };
};

export type ShowcaseShellProps = {
  meta: ShowcaseMeta;
  step: number;
  setStep: (step: number) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  children: ReactNode;
};

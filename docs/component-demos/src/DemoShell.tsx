import type { ReactNode } from "react";
import { Course, Lesson } from "@lessonkit/react";
import { DemoChrome } from "./DemoChrome";
import { demoConfig } from "./demoConfig";

export type DemoShellProps = {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  children: ReactNode;
};

export function DemoShell({ courseId, lessonId, lessonTitle, children }: DemoShellProps) {
  return (
    <DemoChrome>
      <Course title="Security awareness" courseId={courseId} config={demoConfig}>
        <Lesson title={lessonTitle} lessonId={lessonId}>
          {children}
        </Lesson>
      </Course>
    </DemoChrome>
  );
}

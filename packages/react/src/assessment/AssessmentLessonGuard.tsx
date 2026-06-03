import React, { useEffect } from "react";
import type { LessonId } from "@lessonkit/core";
import { useEnclosingLessonId } from "../lessonContext";
import { isDevEnvironment } from "../runtime/validateComponentId";

let warnedAssessmentOutsideLesson = false;

export function resetAssessmentWarningsForTests(): void {
  warnedAssessmentOutsideLesson = false;
}

export type AssessmentLessonGuardProps = {
  blockLabel: string;
  checkId: string;
  children: (enclosingLessonId: LessonId) => React.ReactNode;
};

export function AssessmentLessonGuard(props: AssessmentLessonGuardProps) {
  const enclosingLessonId = useEnclosingLessonId();
  const missingLesson = enclosingLessonId === undefined;

  useEffect(() => {
    if (!missingLesson || isDevEnvironment()) return;
    if (!warnedAssessmentOutsideLesson) {
      warnedAssessmentOutsideLesson = true;
      console.error(
        `[lessonkit] <${props.blockLabel}> must be wrapped in <Lesson>; assessment telemetry will not be emitted.`,
      );
    }
  }, [missingLesson, props.blockLabel]);

  if (missingLesson && isDevEnvironment()) {
    throw new Error(`[lessonkit] <${props.blockLabel}> must be wrapped in <Lesson>`);
  }

  if (missingLesson) {
    return (
      <section role="alert" aria-label={`${props.blockLabel} configuration error`} data-lk-check-id={props.checkId}>
        <p>{props.blockLabel} must be placed inside a Lesson.</p>
      </section>
    );
  }

  return <>{props.children(enclosingLessonId)}</>;
}

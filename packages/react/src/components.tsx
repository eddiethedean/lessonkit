import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { visuallyHiddenStyle } from "@lessonkit/accessibility";
import type { BlockId, CourseId, LessonId } from "@lessonkit/core";
import type { McqAssessmentDescriptor } from "@lessonkit/lxpack";
import { LessonkitProvider, type LessonkitConfig } from "./context";
import { useCompletion, useLessonkit } from "./hooks";
import { LessonContext } from "./lessonContext";
import { getLessonMountCount, registerLessonMount } from "./runtime/lessonMountRegistry";
import { normalizeComponentId } from "./runtime/validateComponentId";

export {
  KnowledgeCheck,
  Quiz,
  resetQuizWarningsForTests,
  type QuizProps,
} from "./components/Quiz";

export type CourseProps = {
  title: string;
  courseId: CourseId;
  config?: Omit<LessonkitConfig, "courseId">;
  children: React.ReactNode;
};

export type LessonProps = {
  title: string;
  lessonId: LessonId;
  /** When false, unmount does not emit lesson_completed (for routed multi-pane layouts). Default true. */
  autoCompleteOnUnmount?: boolean;
  children: React.ReactNode;
};

export type ScenarioProps = {
  blockId?: BlockId;
  children: React.ReactNode;
};

export type ReflectionProps = {
  blockId?: BlockId;
  prompt?: string;
  hint?: string;
  value?: string;
  onChange?: (value: string) => void;
  children?: React.ReactNode;
};

export type KnowledgeCheckProps = McqAssessmentDescriptor;

export type ProgressTrackerProps = {
  totalLessons?: number;
};

export function Course(props: CourseProps) {
  const courseId = useMemo(() => normalizeComponentId(props.courseId, "courseId"), [props.courseId]);

  const providerConfig = useMemo(
    () => ({ ...props.config, courseId }),
    [props.config, courseId],
  );

  return (
    <LessonkitProvider config={providerConfig}>
      <section aria-label={props.title}>
        <h1>{props.title}</h1>
        <div>{props.children}</div>
      </section>
    </LessonkitProvider>
  );
}

export function Lesson(props: LessonProps) {
  const lessonId = useMemo(() => normalizeComponentId(props.lessonId, "lessonId"), [props.lessonId]);
  const autoComplete = props.autoCompleteOnUnmount !== false;

  const { setActiveLesson, config } = useLessonkit();
  const { completeLesson } = useCompletion();
  const lessonMountGenerationRef = useRef(0);
  const liveCourseIdRef = useRef(config.courseId);
  liveCourseIdRef.current = config.courseId;

  useEffect(() => {
    const unregister = registerLessonMount(lessonId);
    const generation = ++lessonMountGenerationRef.current;
    const mountedCourseId = config.courseId;
    let effectSurvivedTick = false;
    queueMicrotask(() => {
      queueMicrotask(() => {
        effectSurvivedTick = true;
      });
    });
    setActiveLesson(lessonId);
    return () => {
      unregister();
      if (getLessonMountCount(lessonId) > 0) {
        return;
      }
      if (!autoComplete) return;
      queueMicrotask(() => {
        if (!effectSurvivedTick) return;
        if (lessonMountGenerationRef.current !== generation) return;
        /* v8 ignore start -- course switch updates live courseId before unmount microtask runs */
        if (liveCourseIdRef.current !== mountedCourseId) return;
        /* v8 ignore stop */
        completeLesson(lessonId, { courseId: mountedCourseId });
      });
    };
  }, [lessonId, config.courseId, setActiveLesson, completeLesson, autoComplete]);

  return (
    <LessonContext.Provider value={lessonId}>
      <article aria-label={props.title}>
        <h2>{props.title}</h2>
        <div>{props.children}</div>
      </article>
    </LessonContext.Provider>
  );
}

export function Scenario(props: ScenarioProps) {
  const blockId = useMemo(
    () => (props.blockId !== undefined ? normalizeComponentId(props.blockId, "blockId") : undefined),
    [props.blockId],
  );
  return (
    <section aria-label="Scenario" data-lk-block-id={blockId}>
      {props.children}
    </section>
  );
}

export function Reflection(props: ReflectionProps) {
  const blockId = useMemo(
    () => (props.blockId !== undefined ? normalizeComponentId(props.blockId, "blockId") : undefined),
    [props.blockId],
  );
  const promptId = useId();
  const hintId = useId();
  const [internalValue, setInternalValue] = useState("");
  const isControlled = props.value !== undefined;
  const value = isControlled ? props.value : internalValue;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) setInternalValue(event.target.value);
    props.onChange?.(event.target.value);
  };

  return (
    <section aria-label="Reflection" data-lk-block-id={blockId}>
      {props.prompt ? <p id={promptId}>{props.prompt}</p> : null}
      {props.hint ? (
        <p id={hintId} style={visuallyHiddenStyle}>
          {props.hint}
        </p>
      ) : null}
      {props.children}
      <textarea
        value={value}
        onChange={handleChange}
        aria-labelledby={props.prompt ? promptId : undefined}
        aria-describedby={props.hint ? hintId : undefined}
        aria-label={props.prompt ? undefined : "Reflection response"}
      />
    </section>
  );
}

export function ProgressTracker(props: ProgressTrackerProps) {
  const { progress } = useLessonkit();
  const completed = progress.completedLessonIds.size;

  if (props.totalLessons != null) {
    const total = props.totalLessons;
    const displayed = Math.min(completed, total);
    return (
      <aside aria-label="Progress">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={displayed}
          aria-label="Lessons completed"
        >
          <p>
            Lessons completed: {displayed} of {total}
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Progress" role="status">
      <p>Lessons completed: {completed}</p>
    </aside>
  );
}

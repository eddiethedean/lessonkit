import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { visuallyHiddenStyle } from "@lessonkit/accessibility";
import type { AssessmentScoreResult, BlockId, CourseId, LessonId } from "@lessonkit/core";
import type { McqAssessmentDescriptor } from "@lessonkit/lxpack";
import { meetsPassingThreshold } from "./assessment/scoring";
import { LessonkitProvider, type LessonkitConfig } from "./context";
import { useCompletion, useLessonkit, useQuizState } from "./hooks";
import { LessonContext, useEnclosingLessonId } from "./lessonContext";
import { getLessonMountCount, registerLessonMount } from "./runtime/lessonMountRegistry";
import { buildPluginContext } from "./runtime/plugins";
import { isDevEnvironment, normalizeComponentId } from "./runtime/validateComponentId";

let warnedQuizOutsideLesson = false;

/** @internal Reset module warnings between tests. */
export function resetQuizWarningsForTests(): void {
  warnedQuizOutsideLesson = false;
}

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

export type QuizProps = McqAssessmentDescriptor;

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

export function KnowledgeCheck(props: KnowledgeCheckProps) {
  return (
    <Quiz
      checkId={props.checkId}
      question={props.question}
      choices={props.choices}
      answer={props.answer}
      passingScore={props.passingScore}
    />
  );
}

export function Quiz(props: QuizProps) {
  const enclosingLessonId = useEnclosingLessonId();
  const missingLesson = enclosingLessonId === undefined;

  useEffect(() => {
    if (!missingLesson || isDevEnvironment()) return;
    /* v8 ignore start -- warnedQuizOutsideLesson gate only runs once per module load */
    if (!warnedQuizOutsideLesson) {
      warnedQuizOutsideLesson = true;
      console.error(
        "[lessonkit] <Quiz> must be wrapped in <Lesson>; quiz telemetry will not be emitted.",
      );
    }
    /* v8 ignore stop */
  }, [missingLesson]);

  if (missingLesson && isDevEnvironment()) {
    throw new Error("[lessonkit] <Quiz> must be wrapped in <Lesson>");
  }

  if (missingLesson) {
    return (
      <section role="alert" aria-label="Quiz configuration error" data-lk-check-id={props.checkId}>
        <p>Quiz must be placed inside a Lesson.</p>
      </section>
    );
  }

  return <QuizInner {...props} enclosingLessonId={enclosingLessonId} />;
}

function QuizInner(props: QuizProps & { enclosingLessonId: LessonId }) {
  const { enclosingLessonId } = props;
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);

  const quiz = useQuizState(enclosingLessonId);
  const { plugins, config, session } = useLessonkit();
  const [selected, setSelected] = useState<string | null>(null);
  const [selectionCorrect, setSelectionCorrect] = useState<boolean | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const completedRef = useRef(false);
  const questionId = useId();
  const choicesKey = props.choices.join("\0");

  useEffect(() => {
    completedRef.current = false;
    setQuizPassed(false);
    setSelected(null);
    setSelectionCorrect(null);
  }, [checkId, props.answer, props.question, config.courseId, enclosingLessonId, choicesKey]);

  const isChoiceCorrect = (choice: string, custom: AssessmentScoreResult | null): boolean => {
    if (!custom) return choice === props.answer;
    if (custom.passed !== undefined) return custom.passed;
    if (custom.maxScore != null && custom.maxScore > 0 && custom.score != null) {
      return meetsPassingThreshold(custom.score, custom.maxScore, props.passingScore);
    }
    return choice === props.answer;
  };

  const passed = quizPassed;

  return (
    <section aria-label="Quiz" data-lk-check-id={checkId}>
      <p id={questionId}>{props.question}</p>
      <fieldset aria-labelledby={questionId}>
        <legend style={visuallyHiddenStyle}>Quiz choices</legend>
        {props.choices.map((c, i) => (
          <label key={`${questionId}-${i}`} style={{ display: "block" }}>
            <input
              type="radio"
              name={questionId}
              value={c}
              checked={selected === c}
              disabled={passed}
              aria-invalid={selected === c && selectionCorrect === false ? true : undefined}
              onChange={() => {
                if (passed) return;
                setSelected(c);
                const pluginCtx = buildPluginContext({
                  courseId: config.courseId,
                  sessionId: session.sessionId,
                  attemptId: session.attemptId,
                  user: session.user,
                });
                const custom =
                  plugins?.scoreAssessment(
                    {
                      checkId,
                      lessonId: enclosingLessonId,
                      response: c,
                    },
                    pluginCtx,
                  ) ?? null;
                const correct = isChoiceCorrect(c, custom);
                setSelectionCorrect(correct);
                quiz.answer({
                  checkId,
                  question: props.question,
                  choice: c,
                  correct,
                });
                if (correct && !completedRef.current) {
                  completedRef.current = true;
                  setQuizPassed(true);
                  const maxScore = custom?.maxScore ?? 1;
                  quiz.complete({
                    checkId,
                    score: custom?.score ?? maxScore,
                    maxScore,
                    passingScore: props.passingScore ?? maxScore,
                  });
                }
              }}
            />
            {c}
          </label>
        ))}
      </fieldset>
      {selected && selectionCorrect !== null ? (
        <p role="status" aria-live="polite">
          {selectionCorrect ? "Correct" : "Try again"}
        </p>
      ) : null}
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

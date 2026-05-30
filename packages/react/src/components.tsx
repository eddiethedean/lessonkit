import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { visuallyHiddenStyle } from "@lessonkit/accessibility";
import type { AssessmentScoreResult, BlockId, CheckId, CourseId, LessonId } from "@lessonkit/core";
import { LessonkitProvider } from "./context";
import { useCompletion, useLessonkit, useQuizState } from "./hooks";
import { LessonContext, useEnclosingLessonId } from "./lessonContext";
import { buildPluginContext } from "./runtime/plugins";
import { warnInvalidComponentId } from "./runtime/validateComponentId";

export function Course(props: {
  title: string;
  courseId: CourseId;
  config?: Omit<React.ComponentProps<typeof LessonkitProvider>["config"], "courseId">;
  children: React.ReactNode;
}) {
  warnInvalidComponentId(props.courseId, "courseId");

  const providerConfig = useMemo(
    () => ({ ...props.config, courseId: props.courseId }),
    [props.config, props.courseId],
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

export function Lesson(props: { title: string; lessonId: LessonId; children: React.ReactNode }) {
  warnInvalidComponentId(props.lessonId, "lessonId");

  const { setActiveLesson, config } = useLessonkit();
  const { completeLesson } = useCompletion();
  const id = props.lessonId;
  const lessonMountGenerationRef = useRef(0);

  useEffect(() => {
    const generation = ++lessonMountGenerationRef.current;
    setActiveLesson(id);
    return () => {
      const lessonId = id;
      queueMicrotask(() => {
        if (lessonMountGenerationRef.current !== generation) return;
        completeLesson(lessonId);
      });
    };
  }, [id, config.courseId, setActiveLesson, completeLesson]);

  return (
    <LessonContext.Provider value={id}>
      <article aria-label={props.title}>
        <h2>{props.title}</h2>
        <div>{props.children}</div>
      </article>
    </LessonContext.Provider>
  );
}

export function Scenario(props: { blockId?: BlockId; children: React.ReactNode }) {
  if (props.blockId !== undefined) warnInvalidComponentId(props.blockId, "blockId");
  return <section aria-label="Scenario" data-lk-block-id={props.blockId}>{props.children}</section>;
}

export function Reflection(props: {
  blockId?: BlockId;
  prompt?: string;
  children?: React.ReactNode;
}) {
  if (props.blockId !== undefined) warnInvalidComponentId(props.blockId, "blockId");
  const promptId = useId();
  return (
    <section aria-label="Reflection" data-lk-block-id={props.blockId}>
      {props.prompt ? <p id={promptId}>{props.prompt}</p> : null}
      {props.children}
      <textarea
        aria-labelledby={props.prompt ? promptId : undefined}
        aria-label={props.prompt ? undefined : "Reflection response"}
      />
    </section>
  );
}

export function KnowledgeCheck(props: {
  checkId: CheckId;
  question: string;
  choices: string[];
  answer: string;
  passingScore?: number;
}) {
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

export function Quiz(props: {
  checkId: CheckId;
  question: string;
  choices: string[];
  answer: string;
  passingScore?: number;
}) {
  warnInvalidComponentId(props.checkId, "checkId");

  const enclosingLessonId = useEnclosingLessonId();
  const quiz = useQuizState(enclosingLessonId);
  const { plugins, config, session } = useLessonkit();
  const [selected, setSelected] = useState<string | null>(null);
  const [selectionCorrect, setSelectionCorrect] = useState<boolean | null>(null);
  const completedRef = useRef(false);
  const questionId = useId();
  const choicesKey = props.choices.join("\0");

  useEffect(() => {
    completedRef.current = false;
    setSelected(null);
    setSelectionCorrect(null);
  }, [props.checkId, props.answer, props.question, config.courseId, enclosingLessonId, choicesKey]);

  const isChoiceCorrect = (choice: string, custom: AssessmentScoreResult | null): boolean => {
    if (!custom) return choice === props.answer;
    if (custom.passed !== undefined) return custom.passed;
    if (custom.maxScore != null && custom.maxScore > 0) {
      return custom.score / custom.maxScore >= 1;
    }
    return choice === props.answer;
  };

  return (
    <section aria-label="Quiz" data-lk-check-id={props.checkId}>
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
              onChange={() => {
                setSelected(c);
                const pluginCtx = buildPluginContext({
                  courseId: config.courseId,
                  sessionId: session.sessionId,
                  attemptId: session.attemptId,
                });
                const custom =
                  plugins?.scoreAssessment(
                    {
                      checkId: props.checkId,
                      lessonId: enclosingLessonId,
                      response: c,
                    },
                    pluginCtx,
                  ) ?? null;
                const correct = isChoiceCorrect(c, custom);
                setSelectionCorrect(correct);
                quiz.answer({
                  checkId: props.checkId,
                  question: props.question,
                  choice: c,
                  correct,
                });
                if (correct && !completedRef.current) {
                  completedRef.current = true;
                  quiz.complete({
                    checkId: props.checkId,
                    score: custom?.score ?? 1,
                    maxScore: custom?.maxScore ?? 1,
                    passingScore: props.passingScore ?? 1,
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

export function ProgressTracker() {
  const { progress } = useLessonkit();
  const completed = progress.completedLessonIds.size;
  return (
    <aside aria-label="Progress">
      <p>Lessons completed: {completed}</p>
    </aside>
  );
}

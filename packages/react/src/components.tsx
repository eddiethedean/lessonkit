import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { visuallyHiddenStyle } from "@lessonkit/accessibility";
import type { BlockId, CheckId, CourseId, LessonId } from "@lessonkit/core";
import { LessonkitProvider } from "./context";
import { useCompletion, useLessonkit, useQuizState } from "./hooks";
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

  const { setActiveLesson } = useLessonkit();
  const { completeLesson } = useCompletion();
  const id = props.lessonId;
  const pendingCompleteRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pendingCompleteRef.current !== null) {
      clearTimeout(pendingCompleteRef.current);
      pendingCompleteRef.current = null;
    }
    setActiveLesson(id);
    return () => {
      const lessonId = id;
      pendingCompleteRef.current = setTimeout(() => {
        pendingCompleteRef.current = null;
        completeLesson(lessonId);
      }, 0);
    };
  }, [id, setActiveLesson, completeLesson]);

  return (
    <article aria-label={props.title}>
      <h2>{props.title}</h2>
      <div>{props.children}</div>
    </article>
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
}) {
  return (
    <Quiz
      checkId={props.checkId}
      question={props.question}
      choices={props.choices}
      answer={props.answer}
    />
  );
}

export function Quiz(props: {
  checkId: CheckId;
  question: string;
  choices: string[];
  answer: string;
}) {
  warnInvalidComponentId(props.checkId, "checkId");

  const quiz = useQuizState();
  const [selected, setSelected] = useState<string | null>(null);
  const completedRef = useRef(false);
  const questionId = useId();

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
                const correct = c === props.answer;
                quiz.answer({
                  checkId: props.checkId,
                  question: props.question,
                  choice: c,
                  correct,
                });
                if (correct && !completedRef.current) {
                  completedRef.current = true;
                  quiz.complete({ checkId: props.checkId, score: 1, maxScore: 1 });
                }
              }}
            />
            {c}
          </label>
        ))}
      </fieldset>
      {selected ? (
        <p role="status" aria-live="polite">
          {selected === props.answer ? "Correct" : "Try again"}
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

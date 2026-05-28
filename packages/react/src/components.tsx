import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { visuallyHiddenStyle } from "@lessonkit/accessibility";
import type { CourseId, LessonId } from "@lessonkit/core";
import { LessonkitProvider } from "./context";
import { useCompletion, useLessonkit, useQuizState } from "./hooks";

export function Course(props: {
  title: string;
  courseId?: CourseId;
  config?: Omit<React.ComponentProps<typeof LessonkitProvider>["config"], "courseId">;
  children: React.ReactNode;
}) {
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

export function Lesson(props: { title: string; lessonId?: LessonId; children: React.ReactNode }) {
  const { setActiveLesson } = useLessonkit();
  const { completeLesson } = useCompletion();
  // `useId()` is SSR/hydration-stable; avoid randomness for implicit IDs.
  const reactId = useId();
  const generatedId = useMemo(() => `lesson-${sanitizeLessonId(reactId)}`, [reactId]);
  const id = props.lessonId ?? generatedId;

  useEffect(() => {
    setActiveLesson(id);
    return () => {
      completeLesson(id);
    };
  }, [id, setActiveLesson, completeLesson]);

  return (
    <article aria-label={props.title}>
      <h2>{props.title}</h2>
      <div>{props.children}</div>
    </article>
  );
}

export function Scenario(props: { children: React.ReactNode }) {
  return <section aria-label="Scenario">{props.children}</section>;
}

export function Reflection(props: { prompt?: string; children?: React.ReactNode }) {
  const promptId = useId();
  return (
    <section aria-label="Reflection">
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
  question: string;
  choices: string[];
  answer: string;
}) {
  return <Quiz question={props.question} choices={props.choices} answer={props.answer} />;
}

export function Quiz(props: { question: string; choices: string[]; answer: string }) {
  const quiz = useQuizState();
  const [selected, setSelected] = useState<string | null>(null);
  const completedRef = useRef(false);
  const questionId = useId();

  return (
    <section aria-label="Quiz">
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
                quiz.answer({ question: props.question, choice: c, correct });
                if (correct && !completedRef.current) {
                  completedRef.current = true;
                  quiz.complete({ score: 1, maxScore: 1 });
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

/** Sanitize React `useId()` for lesson identifiers (exported for tests). */
export function sanitizeLessonId(id: string): string {
  const s = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return s.length ? s : "id";
}


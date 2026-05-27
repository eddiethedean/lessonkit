import React, { useEffect, useId, useMemo, useState } from "react";
import type { CourseId, LessonId } from "@lessonkit/core";
import { LessonkitProvider } from "./context";
import { useCompletion, useLessonkit, useQuizState } from "./hooks";

export function Course(props: {
  title: string;
  courseId?: CourseId;
  config?: Omit<React.ComponentProps<typeof LessonkitProvider>["config"], "courseId">;
  children: React.ReactNode;
}) {
  return (
    <LessonkitProvider config={{ ...props.config, courseId: props.courseId }}>
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
  const generatedId = useMemo(() => `lesson-${cryptoRandomId()}`, []);
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
  const questionId = useId();

  return (
    <section aria-label="Quiz">
      <p id={questionId}>{props.question}</p>
      <fieldset aria-labelledby={questionId}>
        <legend className="sr-only">Quiz choices</legend>
        {props.choices.map((c) => (
          <label key={c} style={{ display: "block" }}>
            <input
              type="radio"
              name={questionId}
              value={c}
              checked={selected === c}
              onChange={() => {
                setSelected(c);
                quiz.answer({ question: props.question, choice: c, correct: c === props.answer });
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

function cryptoRandomId(): string {
  // Avoid importing heavy deps; fallback to Math.random for non-secure uniqueness.
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return Math.random().toString(16).slice(2);
}


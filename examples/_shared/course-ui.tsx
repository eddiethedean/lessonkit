import React from "react";
import { useLessonkit } from "@lessonkit/react";

export type LessonMeta = {
  id: string;
  title: string;
  duration: string;
  type: string;
};

export function CourseTopbar(props: {
  title: string;
  subtitle: string;
  lessonCount: number;
  estimate: string;
  chips?: React.ReactNode;
}) {
  const { progress } = useLessonkit();
  const completed = progress.completedLessonIds.size;
  const pct = props.lessonCount > 0 ? Math.round((completed / props.lessonCount) * 100) : 0;
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <header className="lms-topbar">
      <div className="lms-topbar-brand">
        <p className="lms-topbar-heading">{props.title}</p>
        <p className="lms-topbar-meta">{props.subtitle}</p>
        {props.chips ? <div className="lms-chips">{props.chips}</div> : null}
      </div>
      <div className="lms-progress-ring" aria-label={`${pct}% complete`}>
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle className="track" cx="24" cy="24" r={r} />
          <circle
            className="fill"
            cx="24"
            cy="24"
            r={r}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="lms-progress-label">
          <strong>{pct}%</strong>
          {completed} / {props.lessonCount} · {props.estimate}
        </div>
      </div>
    </header>
  );
}

export function SidebarLessons(props: {
  lessons: readonly LessonMeta[];
  step: number;
  setStep: (n: number) => void;
  title?: string;
  footer?: React.ReactNode;
}) {
  const { progress } = useLessonkit();

  return (
    <nav className="lms-sidebar" aria-label="Course curriculum">
      <p className="lms-sidebar-title">{props.title ?? "Curriculum"}</p>
      <ol className="lms-outline">
        {props.lessons.map((lesson, i) => {
          const done = progress.completedLessonIds.has(lesson.id);
          const active = props.step === i;
          return (
            <li key={lesson.id}>
              <button
                type="button"
                className={`lms-outline-btn${done ? " lms-outline-done" : ""}${active ? " lms-outline-active" : ""}`}
                aria-current={active ? "step" : undefined}
                onClick={() => props.setStep(i)}
              >
                <span className="lms-outline-label">
                  {i + 1}. {lesson.title}
                </span>
                <span className="lms-outline-meta muted">
                  {lesson.type} · {lesson.duration}
                </span>
                <span className="lms-outline-bar" aria-hidden="true">
                  <span style={{ width: done ? "100%" : active ? "40%" : "0%" }} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {props.footer ? <div className="lms-sidebar-footer">{props.footer}</div> : null}
    </nav>
  );
}

export function LessonIntro(props: { type: string; title: string; duration: string }) {
  return (
    <div className="lms-lesson-header" aria-hidden="true">
      <span className="lms-lesson-type">{props.type}</span>
      <p className="lms-lesson-title">{props.title}</p>
      <span className="lms-lesson-duration">{props.duration}</span>
    </div>
  );
}

import React from "react";
import {
  Course,
  Lesson,
  ProgressTracker,
  Quiz,
  Reflection,
  Scenario,
  ThemeProvider,
  useCompletion,
  useLessonkit,
  useTracking,
  type ThemeMode,
} from "@lessonkit/react";
import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIStatement } from "@lessonkit/xapi";

const COURSE_ID = "data-privacy-essentials";

const LESSONS = [
  { id: "why-privacy-matters", title: "Why privacy matters at work" },
  { id: "collecting-and-using-data", title: "Collecting and using data" },
  { id: "incidents-and-reporting", title: "Incidents and reporting" },
  { id: "knowledge-check", title: "Knowledge check" },
] as const;

export default function App() {
  const [step, setStep] = React.useState(0);
  const [themeMode, setThemeMode] = React.useState<ThemeMode>("dark");

  const courseConfig = React.useMemo(
    () => ({
      tracking: { sink: (event: TelemetryEvent) => console.log("[telemetry]", event) },
      xapi: { transport: (statement: XAPIStatement) => console.log("[xapi]", statement) },
    }),
    [],
  );

  return (
    <ThemeProvider mode={themeMode} preset="brand">
      <div className="app-shell">
        <Course title="Data Privacy Essentials" courseId={COURSE_ID} config={courseConfig}>
          <header className="course-header">
            <p className="course-eyebrow">Compliance onboarding · ~10 minutes</p>
            <p className="course-intro muted">
              Understand how your organization handles personal data, what you may collect in your role, and
              how to report concerns. Progress saves automatically.
            </p>
            <ul className="objectives">
              <li>Explain why personal data needs protection in everyday work</li>
              <li>Apply data minimization when gathering information</li>
              <li>Recognize when to report a possible privacy incident</li>
            </ul>
          </header>

          <ProgressTracker />

          <CourseNav
            step={step}
            setStep={setStep}
            themeMode={themeMode}
            onThemeModeChange={setThemeMode}
          />

          {step === 0 ? (
            <Lesson title={LESSONS[0].title} lessonId={LESSONS[0].id}>
              <Scenario>
                <p>
                  Three real-world situations from last quarter. For each, decide whether the handling was
                  acceptable or should be escalated to your privacy office.
                </p>
              </Scenario>
              <PrivacyCases />
            </Lesson>
          ) : null}

          {step === 1 ? (
            <Lesson title={LESSONS[1].title} lessonId={LESSONS[1].id}>
              <Scenario>
                <p>
                  You are organizing a voluntary lunch-and-learn. The registration form is almost ready—trim
                  fields so you only collect what you need.
                </p>
              </Scenario>
              <RegistrationFormExercise />
            </Lesson>
          ) : null}

          {step === 2 ? (
            <Lesson title={LESSONS[2].title} lessonId={LESSONS[2].id}>
              <Scenario>
                <p>
                  A contractor forwards a spreadsheet they should not have received. Walk through the first
                  hour response.
                </p>
              </Scenario>
              <IncidentSteps />
            </Lesson>
          ) : null}

          {step === 3 ? (
            <Lesson title={LESSONS[3].title} lessonId={LESSONS[3].id}>
              <Scenario>
                <p>Confirm your understanding before your LMS marks the module complete.</p>
              </Scenario>
              <Quiz
                checkId="privacy-knowledge-check"
                question="A teammate asks you to export a customer list to their personal email for convenience. What should you do first?"
                choices={[
                  "Send the export— they are on the same team",
                  "Decline and use approved systems; report if policy is unclear",
                ]}
                answer="Decline and use approved systems; report if policy is unclear"
              />
              <FinishCourse />
            </Lesson>
          ) : null}
        </Course>
      </div>
    </ThemeProvider>
  );
}

function ThemeToggle(props: { mode: ThemeMode; onChange: (mode: ThemeMode) => void }) {
  return (
    <div className="theme-toggle" role="group" aria-label="Display theme">
      {(["light", "dark", "system"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={props.mode === m}
          className={props.mode === m ? "theme-toggle-active" : undefined}
          onClick={() => props.onChange(m)}
        >
          {m === "system" ? "System" : m === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </div>
  );
}

function CourseNav(props: {
  step: number;
  setStep: (n: number) => void;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
}) {
  const { progress } = useLessonkit();
  const completed = progress.completedLessonIds.size;
  const last = LESSONS.length - 1;

  return (
    <aside aria-label="Course navigation" className="nav">
      <div className="lesson-tabs" role="tablist" aria-label="Lessons">
        {LESSONS.map((lesson, i) => (
          <button
            key={lesson.id}
            type="button"
            role="tab"
            aria-selected={props.step === i}
            className={props.step === i ? "tab-active" : undefined}
            onClick={() => props.setStep(i)}
          >
            {i + 1}. {lesson.title}
          </button>
        ))}
      </div>
      <div className="nav-row">
        <button type="button" onClick={() => props.setStep(Math.max(0, props.step - 1))} disabled={props.step === 0}>
          Previous
        </button>
        <div className="nav-status">
          <strong>Progress</strong> {completed} of {LESSONS.length} lessons completed
        </div>
        <button
          type="button"
          onClick={() => props.setStep(Math.min(last, props.step + 1))}
          disabled={props.step === last}
        >
          Next
        </button>
      </div>
      <ThemeToggle mode={props.themeMode} onChange={props.onThemeModeChange} />
    </aside>
  );
}

type CaseStudy = { id: string; title: string; detail: string; acceptable: boolean };

function PrivacyCases() {
  const { track } = useTracking();
  const [verdicts, setVerdicts] = React.useState<Record<string, "ok" | "escalate">>({});

  const cases: CaseStudy[] = React.useMemo(
    () => [
      {
        id: "c1",
        title: "Wrong distribution list",
        detail: "Marketing CC’d 200 customers on a thread meant for internal QA feedback.",
        acceptable: false,
      },
      {
        id: "c2",
        title: "Anonymous survey",
        detail: "HR launched a pulse survey with no names—only department and tenure band.",
        acceptable: true,
      },
      {
        id: "c3",
        title: "Shared drive cleanup",
        detail: "IT archived inactive project folders per retention policy after legal review.",
        acceptable: true,
      },
    ],
    [],
  );

  const judge = (c: CaseStudy, verdict: "ok" | "escalate") => {
    setVerdicts((prev) => ({ ...prev, [c.id]: verdict }));
    track("interaction", { kind: "privacy_case", caseId: c.id, verdict, correct: verdict === (c.acceptable ? "ok" : "escalate") });
  };

  const done = Object.keys(verdicts).length === cases.length;
  const correct = cases.filter((c) => verdicts[c.id] === (c.acceptable ? "ok" : "escalate")).length;

  return (
    <section aria-label="Privacy cases" className="panel">
      <div className="inbox">
        {cases.map((c) => {
          const v = verdicts[c.id];
          return (
            <div key={c.id} className="card">
              <div className="subject">{c.title}</div>
              <p className="body">{c.detail}</p>
              <div className="actions">
                <button type="button" onClick={() => judge(c, "ok")} disabled={Boolean(v)}>
                  Acceptable handling
                </button>
                <button type="button" onClick={() => judge(c, "escalate")} disabled={Boolean(v)}>
                  Escalate to privacy office
                </button>
                {v ? <span className="muted">Recorded: {v === "ok" ? "acceptable" : "escalate"}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
      {done ? (
        <div className="callout" role="status" aria-live="polite">
          <strong>
            {correct === cases.length ? "Well done." : `${correct} of ${cases.length} aligned with policy.`}
          </strong>{" "}
          When in doubt, report early—your privacy team prefers prevention over cleanup.
        </div>
      ) : (
        <p className="muted">Review all three situations to continue.</p>
      )}
    </section>
  );
}

const FORM_FIELDS = [
  { id: "name", label: "Full name", needed: true },
  { id: "email", label: "Work email", needed: true },
  { id: "diet", label: "Dietary restrictions", needed: true },
  { id: "ssn", label: "Last four of SSN (for verification)", needed: false },
  { id: "birth", label: "Date of birth", needed: false },
  { id: "manager", label: "Manager’s personal mobile", needed: false },
] as const;

function RegistrationFormExercise() {
  const { track } = useTracking();
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(["name", "email", "diet", "ssn", "birth", "manager"]),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const unnecessary = FORM_FIELDS.filter((f) => selected.has(f.id) && !f.needed).map((f) => f.id);
  const missing = FORM_FIELDS.filter((f) => f.needed && !selected.has(f.id)).map((f) => f.id);
  const ready = unnecessary.length === 0 && missing.length === 0;

  React.useEffect(() => {
    if (ready) track("interaction", { kind: "form_minimized", fields: [...selected] });
  }, [ready, selected, track]);

  return (
    <section aria-label="Registration form" className="panel">
      <p className="muted">Uncheck any field you do not need for a voluntary internal event.</p>
      <div className="callout">
        {FORM_FIELDS.map((f) => (
          <label key={f.id} className="checkbox-row">
            <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggle(f.id)} />
            {f.label}
            {!f.needed ? <span className="muted"> — optional / often unnecessary</span> : null}
          </label>
        ))}
      </div>
      {ready ? (
        <div className="callout" role="status">
          <strong>Good minimization.</strong> You kept name, email, and dietary needs only—enough to run the event
          without oversharing.
        </div>
      ) : (
        <p className="muted" role="status">
          {missing.length > 0
            ? `Add back required fields: ${missing.join(", ")}.`
            : `Remove unnecessary fields: ${unnecessary.join(", ")}.`}
        </p>
      )}
    </section>
  );
}

const INCIDENT_STEPS = [
  { id: "s1", label: "Contain access (revoke link, lock account)" },
  { id: "s2", label: "Notify privacy / security per playbook" },
  { id: "s3", label: "Document what data was exposed and when" },
  { id: "s4", label: "Post details in a public channel for visibility" },
] as const;

function IncidentSteps() {
  const { track } = useTracking();
  const [picked, setPicked] = React.useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const correctSet = new Set(["s1", "s2", "s3"]);
  const aligned =
    picked.size === correctSet.size && [...correctSet].every((id) => picked.has(id)) && !picked.has("s4");

  React.useEffect(() => {
    if (aligned) track("interaction", { kind: "incident_steps_complete" });
  }, [aligned, track]);

  return (
    <section aria-label="Incident response" className="panel">
      <p className="muted">Select every action appropriate in the first hour (there may be more than one).</p>
      <div className="callout">
        {INCIDENT_STEPS.map((s) => (
          <label key={s.id} className="checkbox-row">
            <input type="checkbox" checked={picked.has(s.id)} onChange={() => toggle(s.id)} />
            {s.label}
          </label>
        ))}
      </div>
      {aligned ? (
        <>
          <div className="callout" role="status">
            <strong>Solid first response.</strong> Avoid discussing details in open channels until privacy advises.
          </div>
          <Reflection prompt="Where would you find your organization’s privacy incident hotline or ticket queue?" />
        </>
      ) : (
        <p className="muted">Include containment, notification, and documentation—skip public disclosure.</p>
      )}
    </section>
  );
}

function FinishCourse() {
  const { progress } = useLessonkit();
  const { completeCourse } = useCompletion();
  const done = progress.completedLessonIds.size >= 3;

  return (
    <section aria-label="Complete course" className="panel">
      <p className="muted">Pass the knowledge check and complete earlier lessons to finish the module.</p>
      <button type="button" onClick={() => completeCourse()} disabled={!done}>
        Mark module complete
      </button>
      {!done ? <p className="muted">Complete the first three lessons, then pass the check above.</p> : null}
    </section>
  );
}

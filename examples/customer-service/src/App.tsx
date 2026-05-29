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

const COURSE_ID = "customer-de-escalation";

const LESSONS = [
  { id: "active-listening", title: "Listen before you solve" },
  { id: "empathy-language", title: "Words that calm" },
  { id: "solve-or-escalate", title: "Solve or escalate" },
  { id: "skills-check", title: "Skills check" },
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
        <Course title="Customer De-escalation Skills" courseId={COURSE_ID} config={courseConfig}>
          <header className="course-header">
            <p className="course-eyebrow">Frontline training · ~15 minutes</p>
            <p className="course-intro muted">
              Practice staying calm with upset customers, using empathy without over-promising, and knowing when
              to escalate. Your responses are tracked for coaching—not graded for punishment.
            </p>
            <ul className="objectives">
              <li>Reflect customer concerns before offering solutions</li>
              <li>Use language that acknowledges frustration</li>
              <li>Decide when to resolve, compensate, or escalate</li>
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
                  A customer waited three days for a replacement part. They open chat angry about repeated
                  transfers. Choose your first reply.
                </p>
              </Scenario>
              <OpeningResponse />
            </Lesson>
          ) : null}

          {step === 1 ? (
            <Lesson title={LESSONS[1].title} lessonId={LESSONS[1].id}>
              <Scenario>
                <p>Same customer after you acknowledged the delay. Pick the phrase that validates without blaming.</p>
              </Scenario>
              <EmpathyPhrases />
            </Lesson>
          ) : null}

          {step === 2 ? (
            <Lesson title={LESSONS[2].title} lessonId={LESSONS[2].id}>
              <Scenario>
                <p>
                  The part ships tomorrow but missed their project deadline. Continue the conversation—your
                  choices shape the outcome.
                </p>
              </Scenario>
              <EscalationBranch />
            </Lesson>
          ) : null}

          {step === 3 ? (
            <Lesson title={LESSONS[3].title} lessonId={LESSONS[3].id}>
              <Scenario>
                <p>Short assessment before returning to your queue dashboard.</p>
              </Scenario>
              <Quiz
                checkId="de-escalation-check"
                question="A customer threatens chargebacks unless you waive policy. What is the best next step?"
                choices={[
                  "Waive policy immediately to end the chat",
                  "Stay calm, restate policy, and involve a supervisor if threats continue",
                ]}
                answer="Stay calm, restate policy, and involve a supervisor if threats continue"
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

function OpeningResponse() {
  const { track } = useTracking();
  const [choice, setChoice] = React.useState<"deflect" | "reflect" | "blame" | null>(null);

  const pick = (c: "deflect" | "reflect" | "blame") => {
    setChoice(c);
    track("interaction", { kind: "opening_response", choice: c });
  };

  return (
    <section aria-label="Opening response" className="panel">
      <div className="callout">
        <p>
          <strong>Customer:</strong> “This is the fourth agent today. Nobody reads my notes. I want a supervisor
          now.”
        </p>
        <div className="actions">
          <button type="button" onClick={() => pick("deflect")} disabled={choice !== null}>
            Our policy says replacements ship in 5–7 days—you are within window.
          </button>
          <button type="button" onClick={() => pick("reflect")} disabled={choice !== null}>
            I hear you’ve been transferred several times and still don’t have the part—let me read your case notes
            with you.
          </button>
          <button type="button" onClick={() => pick("blame")} disabled={choice !== null}>
            Warehouse delays aren’t something support controls.
          </button>
        </div>
      </div>
      {choice ? (
        <div className="callout" role="status">
          {choice === "reflect" ? (
            <>
              <strong>Strong start.</strong> Reflecting frustration lowers defensiveness before problem-solving.
            </>
          ) : (
            <>
              <strong>Coaching note.</strong> Policy lectures or blame often increase escalation—acknowledge first.
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function EmpathyPhrases() {
  const { track } = useTracking();
  const [choice, setChoice] = React.useState<string | null>(null);

  const options = [
    { id: "a", text: "Calm down and I will help you.", good: false },
    { id: "b", text: "Missing your deadline is frustrating—I would feel the same.", good: true },
    { id: "c", text: "You should have ordered earlier if timing was critical.", good: false },
  ];

  return (
    <section aria-label="Empathy phrases" className="panel">
      {options.map((o) => (
        <div key={o.id} className="card">
          <p className="body">{o.text}</p>
          <button
            type="button"
            disabled={choice !== null}
            onClick={() => {
              setChoice(o.id);
              track("interaction", { kind: "empathy_phrase", id: o.id, good: o.good });
            }}
          >
            Use this phrase
          </button>
        </div>
      ))}
      {choice ? (
        <div className="callout" role="status">
          {options.find((o) => o.id === choice)?.good ? (
            <>
              <strong>Validates without admitting fault.</strong> You can explore solutions next.
            </>
          ) : (
            <>
              <strong>Try again in practice.</strong> “Calm down” and blaming timelines tend to escalate tension.
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function EscalationBranch() {
  const { track } = useTracking();
  const [stage, setStage] = React.useState<"offer" | "credit" | "supervisor" | "done">("offer");

  const choose = (next: typeof stage, event: string) => {
    setStage(next);
    track("interaction", { kind: "escalation_branch", event });
  };

  if (stage === "offer") {
    return (
      <section className="panel" aria-label="Resolution branch">
        <div className="callout">
          <p>
            <strong>Customer:</strong> “Tomorrow doesn’t help—I lost a client. What are you going to do?”
          </p>
          <div className="actions">
            <button type="button" onClick={() => choose("credit", "shipping_credit")}>
              Offer expedited shipping credit and confirm tracking
            </button>
            <button type="button" onClick={() => choose("supervisor", "supervisor_early")}>
              Involve supervisor for compensation review
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (stage === "credit") {
    return (
      <section className="panel">
        <div className="callout" role="status">
          <strong>Resolved at tier-1.</strong> You documented the credit, confirmed tracking, and set a follow-up
          reminder—appropriate when policy allows.
        </div>
        <Reflection prompt="What note would you leave for the next agent so the customer isn’t transferred again?" />
        <button type="button" onClick={() => setStage("done")}>
          Continue
        </button>
      </section>
    );
  }

  if (stage === "supervisor") {
    return (
      <section className="panel">
        <div className="callout" role="status">
          <strong>Escalated appropriately.</strong> High-impact financial harm may need supervisor approval—stay on
          the line until handoff completes.
        </div>
        <button type="button" onClick={() => setStage("done")}>
          Continue
        </button>
      </section>
    );
  }

  return (
    <p className="muted" role="status">
      Branch complete. Move to the skills check when ready.
    </p>
  );
}

function FinishCourse() {
  const { progress } = useLessonkit();
  const { completeCourse } = useCompletion();
  const done = progress.completedLessonIds.size >= 3;

  return (
    <section aria-label="Complete course" className="panel">
      <p className="muted">Complete practice lessons and pass the skills check to finish.</p>
      <button type="button" onClick={() => completeCourse()} disabled={!done}>
        Mark training complete
      </button>
      {!done ? <p className="muted">Finish lessons 1–3, then pass the assessment above.</p> : null}
    </section>
  );
}

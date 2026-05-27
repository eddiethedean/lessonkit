import React from "react";
import { Course, Lesson, ProgressTracker, Quiz, Scenario, useCompletion, useLessonkit, useTracking } from "@lessonkit/react";
import { createXAPIClient } from "@lessonkit/xapi";
import type { TelemetryEvent } from "@lessonkit/core";

export default function App() {
  const [step, setStep] = React.useState(0);

  return (
    <div className="app-shell">
      <Course
        title="React-Native Security Training (Showcase)"
        courseId="react-showcase-security"
        config={{
          tracking: {
            sink: (event: TelemetryEvent) => {
              console.log("[telemetry]", event);
            },
          },
          xapi: {
            client: createXAPIClient({
              transport: (statement) => {
                console.log("[xapi]", statement);
              },
            }),
          },
        }}
      >
        <ProgressTracker />

        <CourseNav step={step} setStep={setStep} />

        {step === 0 ? (
          <Lesson title="1) Adaptive inbox triage" lessonId="inbox-triage">
            <Scenario>
              <p>
                This lesson reacts to your choices: the UI updates immediately, your risk score changes, and the
                next content branches based on your behavior.
              </p>
            </Scenario>
            <InboxTriage />
          </Lesson>
        ) : null}

        {step === 1 ? (
          <Lesson title="2) Time pressure + hints" lessonId="time-pressure">
            <Scenario>
              <p>
                This lesson demonstrates reactivity under time pressure: hints unlock as time passes, and your
                decision affects what the next section reveals.
              </p>
            </Scenario>
            <TimedDecision />
          </Lesson>
        ) : null}

        {step === 2 ? (
          <Lesson title="3) Knowledge check (standard quiz)" lessonId="quiz-101">
            <Scenario>
              <p>
                Here’s the conventional “HTML course” style interaction — but it still feeds telemetry and
                completion the same way.
              </p>
            </Scenario>
            <Quiz
              question="What should you do first when an email feels off?"
              choices={["Click the link quickly", "Verify sender and context"]}
              answer="Verify sender and context"
            />
            <FinishCourse />
          </Lesson>
        ) : null}
      </Course>
    </div>
  );
}

function CourseNav(props: { step: number; setStep: (n: number) => void }) {
  const { progress } = useLessonkit();
  const completed = progress.completedLessonIds.size;

  return (
    <aside aria-label="Navigation" className="nav">
      <div className="nav-row">
        <button onClick={() => props.setStep(Math.max(0, props.step - 1))} disabled={props.step === 0}>
          Previous
        </button>
        <div className="nav-status">
          <strong>Lesson</strong> {props.step + 1} / 3 · <strong>Completed</strong> {completed}
        </div>
        <button onClick={() => props.setStep(Math.min(2, props.step + 1))} disabled={props.step === 2}>
          Next
        </button>
      </div>
      <p className="muted">
        Navigation intentionally unmounts/mounts lessons so you can see lifecycle tracking (start/complete + time
        on task) working like a real app.
      </p>
    </aside>
  );
}

type Email = {
  id: string;
  subject: string;
  from: string;
  body: string;
  isPhish: boolean;
};

function InboxTriage() {
  const { track } = useTracking();
  const [risk, setRisk] = React.useState(0);
  const [handled, setHandled] = React.useState<Record<string, "report" | "open" | "ignore">>({});

  const emails: Email[] = React.useMemo(
    () => [
      {
        id: "e1",
        subject: "Your payroll settings changed",
        from: "HR Support <hr-support@payr0ll-help.com>",
        body: "We detected an issue. Please verify your details with the secure link.",
        isPhish: true,
      },
      {
        id: "e2",
        subject: "Team offsite agenda",
        from: "Alex <alex@company.example>",
        body: "Draft agenda attached — add comments when you have time.",
        isPhish: false,
      },
      {
        id: "e3",
        subject: "Unusual sign-in attempt",
        from: "Security <security@company.example>",
        body: "We blocked a sign-in. If this was you, reset your password from the portal.",
        isPhish: false,
      },
    ],
    [],
  );

  const decide = (email: Email, action: "report" | "open" | "ignore") => {
    setHandled((prev) => ({ ...prev, [email.id]: action }));

    let delta = 0;
    if (email.isPhish && action === "open") delta = 30;
    if (email.isPhish && action === "ignore") delta = 10;
    if (email.isPhish && action === "report") delta = -10;
    if (!email.isPhish && action === "open") delta = 0;
    if (!email.isPhish && action === "ignore") delta = 0;
    if (!email.isPhish && action === "report") delta = 5;

    setRisk((r) => Math.max(0, r + delta));
    track("interaction", { kind: "inbox_action", emailId: email.id, isPhish: email.isPhish, action, riskDelta: delta });
  };

  const allHandled = Object.keys(handled).length === emails.length;
  const grade =
    risk <= 5 ? { label: "Great", detail: "You kept risk low and handled the inbox deliberately." } :
    risk <= 20 ? { label: "Okay", detail: "Some risk accumulated — review why the actions mattered." } :
    { label: "High risk", detail: "In a real org, this pattern leads to incidents. Slow down and verify." };

  return (
    <section aria-label="Inbox triage" className="panel">
      <div className="score-row">
        <div>
          <strong>Live risk score</strong>
          <div className="score">{risk}</div>
        </div>
        <div className="muted">
          This score updates instantly as state changes — it’s not a static page. Your actions also emit telemetry
          events (`interaction`).
        </div>
      </div>

      <div className="inbox">
        {emails.map((e) => {
          const action = handled[e.id];
          return (
            <div key={e.id} className="card">
              <div className="card-head">
                <div>
                  <div className="subject">{e.subject}</div>
                  <div className="meta">From: {e.from}</div>
                </div>
                <div className={`pill ${e.isPhish ? "pill-warn" : "pill-ok"}`}>
                  {e.isPhish ? "Suspicious" : "Likely legit"}
                </div>
              </div>
              <p className="body">{e.body}</p>

              <div className="actions">
                <button onClick={() => decide(e, "open")} disabled={Boolean(action)}>
                  Open
                </button>
                <button onClick={() => decide(e, "ignore")} disabled={Boolean(action)}>
                  Ignore
                </button>
                <button onClick={() => decide(e, "report")} disabled={Boolean(action)}>
                  Report
                </button>
                {action ? <span className="muted">Handled: {action}</span> : null}
              </div>
            </div>
          );
        })}
      </div>

      {allHandled ? (
        <div className="callout" role="status" aria-live="polite">
          <strong>{grade.label}.</strong> {grade.detail}
        </div>
      ) : (
        <div className="muted" role="status" aria-live="polite">
          Handle all emails to see a summary.
        </div>
      )}
    </section>
  );
}

function TimedDecision() {
  const { track } = useTracking();
  const [seconds, setSeconds] = React.useState(0);
  const [choice, setChoice] = React.useState<"panic" | "verify" | null>(null);

  React.useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hintUnlocked = seconds >= 5;
  const deeperHintUnlocked = seconds >= 10;

  const choose = (c: "panic" | "verify") => {
    setChoice(c);
    track("interaction", { kind: "timed_decision", seconds, choice: c });
  };

  return (
    <section aria-label="Timed decision" className="panel">
      <div className="score-row">
        <div>
          <strong>Timer</strong>
          <div className="score">{seconds}s</div>
        </div>
        <div className="muted">
          This kind of progressive disclosure is trivial in React: UI state unlocks hints and branches the story.
        </div>
      </div>

      <div className="callout">
        <p>
          A teammate pings: “I got an email saying my account is locked. Should I follow the instructions?”
        </p>
        <div className="actions">
          <button onClick={() => choose("panic")} disabled={choice !== null}>
            Tell them to act immediately
          </button>
          <button onClick={() => choose("verify")} disabled={choice !== null}>
            Tell them to verify using the portal
          </button>
        </div>
      </div>

      {hintUnlocked ? (
        <div className="hint" role="status" aria-live="polite">
          <strong>Hint unlocked:</strong> attackers use urgency to bypass good judgment.
        </div>
      ) : (
        <div className="muted" role="status" aria-live="polite">
          Hint unlocks in {Math.max(0, 5 - seconds)}s…
        </div>
      )}

      {deeperHintUnlocked ? (
        <div className="hint" role="status" aria-live="polite">
          <strong>Deeper hint:</strong> verify via a known-good path (bookmark, typed URL, or internal portal), not
          the message itself.
        </div>
      ) : null}

      {choice ? (
        <div className="callout" role="status" aria-live="polite">
          {choice === "verify" ? (
            <>
              <strong>Good.</strong> You reduced risk by steering them to a trusted flow.
            </>
          ) : (
            <>
              <strong>Risky.</strong> Urgency + unclear instructions is exactly when you slow down and verify.
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function FinishCourse() {
  const { progress } = useLessonkit();
  const { completeCourse } = useCompletion();
  const done = progress.completedLessonIds.size >= 2;

  return (
    <section aria-label="Finish course" className="panel">
      <p className="muted">
        Course completion is reactive too: this button enables once you’ve actually completed prior lessons.
      </p>
      <button onClick={() => completeCourse()} disabled={!done}>
        Mark course complete
      </button>
      {!done ? <p className="muted">Complete the first two lessons (use Next/Previous) to enable.</p> : null}
    </section>
  );
}


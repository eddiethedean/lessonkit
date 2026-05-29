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

const COURSE_ID = "cybersecurity-awareness";

const LESSONS = [
  { id: "phishing-inbox", title: "Spotting suspicious email" },
  { id: "urgent-requests", title: "Slow down under pressure" },
  { id: "credential-hygiene", title: "Protecting your credentials" },
  { id: "module-assessment", title: "Module assessment" },
] as const;

export default function App() {
  const [step, setStep] = React.useState(0);
  const [themeMode, setThemeMode] = React.useState<ThemeMode>("dark");

  const courseConfig = React.useMemo(
    () => ({
      tracking: {
        sink: (event: TelemetryEvent) => {
          console.log("[telemetry]", event);
        },
      },
      xapi: {
        transport: (statement: XAPIStatement) => {
          console.log("[xapi]", statement);
        },
      },
    }),
    [],
  );

  return (
    <ThemeProvider mode={themeMode} preset="brand">
      <div className="app-shell">
        <Course
          title="Cybersecurity Awareness for Employees"
          courseId={COURSE_ID}
          config={courseConfig}
        >
          <header className="course-header">
            <p className="course-eyebrow">Required annual training · ~12 minutes</p>
            <p className="course-intro muted">
              Learn to recognize phishing, resist social engineering, and protect company and personal
              accounts. Your progress is saved automatically.
            </p>
            <ul className="objectives">
              <li>Identify common phishing signals in email</li>
              <li>Respond safely when someone pressures you to act quickly</li>
              <li>Apply credential hygiene habits at work</li>
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
                  You are covering the shared inbox while a teammate is out. Three messages arrived in
                  the last hour. Review each one and choose the safest action before moving on.
                </p>
              </Scenario>
              <PhishingInbox />
            </Lesson>
          ) : null}

          {step === 1 ? (
            <Lesson title={LESSONS[1].title} lessonId={LESSONS[1].id}>
              <Scenario>
                <p>
                  A colleague messages you on chat: their VPN token expired and payroll is due today.
                  They ask you to approve a reset link they were sent. Take your time—hints appear if
                  you need them.
                </p>
              </Scenario>
              <UrgentRequestScenario />
            </Lesson>
          ) : null}

          {step === 2 ? (
            <Lesson title={LESSONS[2].title} lessonId={LESSONS[2].id}>
              <Scenario>
                <p>
                  Your organization is rolling out passkeys and hardware security keys. Read the
                  policy summary, then note one habit you will adopt this week.
                </p>
              </Scenario>
              <CredentialHygiene />
            </Lesson>
          ) : null}

          {step === 3 ? (
            <Lesson title={LESSONS[3].title} lessonId={LESSONS[3].id}>
              <Scenario>
                <p>Confirm your understanding before returning to your LMS transcript.</p>
              </Scenario>
              <Quiz
                checkId="module-assessment-check"
                question="A vendor emails an invoice with a one-time payment link. What is the best first step?"
                choices={[
                  "Pay immediately to avoid late fees",
                  "Verify the request through your procurement portal or known contact",
                ]}
                answer="Verify the request through your procurement portal or known contact"
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

type Email = {
  id: string;
  subject: string;
  from: string;
  body: string;
  isPhish: boolean;
};

function PhishingInbox() {
  const { track } = useTracking();
  const [risk, setRisk] = React.useState(0);
  const [handled, setHandled] = React.useState<Record<string, "report" | "open" | "ignore">>({});

  const emails: Email[] = React.useMemo(
    () => [
      {
        id: "e1",
        subject: "Action required: payroll direct deposit",
        from: "People Operations <payroll-update@hr-portal-secure.net>",
        body: "Your deposit information will expire today. Confirm your bank details using the secure form.",
        isPhish: true,
      },
      {
        id: "e2",
        subject: "Q3 facilities walkthrough — notes attached",
        from: "Jordan Lee <jlee@company.example>",
        body: "Slides from yesterday’s tour are in SharePoint. No action needed unless you spot a correction.",
        isPhish: false,
      },
      {
        id: "e3",
        subject: "Password reset requested for your account",
        from: "IT Service Desk <it-help@company.example>",
        body: "We received a reset request. If this was not you, contact the help desk extension 2200.",
        isPhish: false,
      },
    ],
    [],
  );

  const decide = (email: Email, action: "report" | "open" | "ignore") => {
    setHandled((prev) => ({ ...prev, [email.id]: action }));

    let delta = 0;
    if (email.isPhish && action === "open") delta = 30;
    if (email.isPhish && action === "ignore") delta = 12;
    if (email.isPhish && action === "report") delta = -8;
    if (!email.isPhish && action === "report") delta = 4;

    setRisk((r) => Math.max(0, r + delta));
    track("interaction", { kind: "inbox_action", emailId: email.id, isPhish: email.isPhish, action, riskDelta: delta });
  };

  const allHandled = Object.keys(handled).length === emails.length;
  const grade =
    risk <= 5
      ? { label: "Strong judgment", detail: "You reported the suspicious payroll message and avoided risky clicks." }
      : risk <= 18
        ? { label: "Needs review", detail: "Consider why official IT channels differ from look-alike domains." }
        : { label: "High exposure", detail: "In production, opening unknown links can compromise your workstation." };

  return (
    <section aria-label="Inbox exercise" className="panel">
      <div className="score-row">
        <div>
          <strong>Risk indicator</strong>
          <div className="score">{risk}</div>
        </div>
        <p className="muted">Lower is better. Report phishing using your company’s official button when available.</p>
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
                  {e.isPhish ? "Review carefully" : "Likely legitimate"}
                </div>
              </div>
              <p className="body">{e.body}</p>
              <div className="actions">
                <button type="button" onClick={() => decide(e, "report")} disabled={Boolean(action)}>
                  Report as phishing
                </button>
                <button type="button" onClick={() => decide(e, "open")} disabled={Boolean(action)}>
                  Open attachment / link
                </button>
                <button type="button" onClick={() => decide(e, "ignore")} disabled={Boolean(action)}>
                  Ignore for now
                </button>
                {action ? <span className="muted">You chose: {action}</span> : null}
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
        <p className="muted" role="status" aria-live="polite">
          Review all messages to unlock feedback.
        </p>
      )}
    </section>
  );
}

function UrgentRequestScenario() {
  const { track } = useTracking();
  const [seconds, setSeconds] = React.useState(0);
  const [choice, setChoice] = React.useState<"approve" | "verify" | null>(null);

  React.useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hintUnlocked = seconds >= 5;
  const deeperHintUnlocked = seconds >= 10;

  const choose = (c: "approve" | "verify") => {
    setChoice(c);
    track("interaction", { kind: "urgent_request", seconds, choice: c });
  };

  return (
    <section aria-label="Urgent request scenario" className="panel">
      <div className="score-row">
        <div>
          <strong>Time on scenario</strong>
          <div className="score">{seconds}s</div>
        </div>
        <p className="muted">Legitimate IT teams rarely pressure you through unofficial chat links.</p>
      </div>

      <div className="callout">
        <p>
          <strong>Jordan (chat):</strong> “Can you approve this reset? Payroll locks me out in 20 minutes and
          I’m stuck on a call.”
        </p>
        <div className="actions">
          <button type="button" onClick={() => choose("approve")} disabled={choice !== null}>
            Forward the reset link they sent
          </button>
          <button type="button" onClick={() => choose("verify")} disabled={choice !== null}>
            Ask them to use the official IT self-service portal
          </button>
        </div>
      </div>

      {hintUnlocked ? (
        <div className="hint" role="status" aria-live="polite">
          <strong>Coaching tip:</strong> urgency is a common social engineering tactic—pause before acting.
        </div>
      ) : (
        <p className="muted" role="status" aria-live="polite">
          Coaching tip unlocks in {Math.max(0, 5 - seconds)}s…
        </p>
      )}

      {deeperHintUnlocked ? (
        <div className="hint" role="status" aria-live="polite">
          <strong>Policy reminder:</strong> never use links from chat or email—open the portal from your bookmark or
          intranet.
        </div>
      ) : null}

      {choice ? (
        <div className="callout" role="status" aria-live="polite">
          {choice === "verify" ? (
            <>
              <strong>Correct approach.</strong> You redirected Jordan to a trusted channel without sharing
              credentials.
            </>
          ) : (
            <>
              <strong>Risky choice.</strong> Attackers often impersonate coworkers to bypass verification steps.
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function CredentialHygiene() {
  const [acknowledged, setAcknowledged] = React.useState(false);

  return (
    <section aria-label="Credential hygiene" className="panel">
      <div className="callout">
        <h3 className="section-title">Policy highlights</h3>
        <ul>
          <li>Use a unique password or passkey for every work system.</li>
          <li>Approve MFA prompts only when you initiated the sign-in.</li>
          <li>Never store passwords in chat, tickets, or shared documents.</li>
        </ul>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          I will enable MFA on my primary work account this week.
        </label>
      </div>
      <Reflection prompt="Name one habit you will change after this module (e.g., password manager, hardware key)." />
    </section>
  );
}

function FinishCourse() {
  const { progress } = useLessonkit();
  const { completeCourse } = useCompletion();
  const done = progress.completedLessonIds.size >= 3;

  return (
    <section aria-label="Complete course" className="panel">
      <p className="muted">
        When you have passed the assessment and visited earlier lessons, mark the module complete for your
        training record.
      </p>
      <button type="button" onClick={() => completeCourse()} disabled={!done}>
        Mark module complete
      </button>
      {!done ? (
        <p className="muted">Complete the first three lessons, then pass the assessment above.</p>
      ) : null}
    </section>
  );
}

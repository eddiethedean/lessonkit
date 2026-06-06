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
import {
  CourseTopbar,
  LessonIntro,
  SidebarLessons,
  type LessonMeta,
} from "../../_shared/course-ui";
import { allowConsoleTelemetryForDocsDemo } from "../../_shared/docsDemoConfig";

const COURSE_ID = "cybersecurity-awareness";

const LESSONS: readonly LessonMeta[] = [
  { id: "assignment", title: "Assignment & policy", duration: "2 min", type: "Reading" },
  { id: "phishing-inbox", title: "Email triage lab", duration: "4 min", type: "Simulation" },
  { id: "smishing-texts", title: "Smishing on mobile", duration: "3 min", type: "Simulation" },
  { id: "urgent-requests", title: "Pressure tactics", duration: "3 min", type: "Scenario" },
  { id: "credential-hygiene", title: "Credential hygiene", duration: "3 min", type: "Activity" },
  { id: "module-assessment", title: "Annual attestation", duration: "2 min", type: "Assessment" },
];

export default function App() {
  const [step, setStep] = React.useState(0);
  const [themeMode, setThemeMode] = React.useState<ThemeMode>("dark");

  const courseConfig = React.useMemo(
    () => ({
      ...allowConsoleTelemetryForDocsDemo(),
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

  const last = LESSONS.length - 1;
  const current = LESSONS[step]!;

  return (
    <ThemeProvider mode={themeMode} preset="brand">
      <div className="lms-app lms-theme-security">
        <Course
          title="Cybersecurity Awareness for Employees"
          courseId={COURSE_ID}
          config={courseConfig}
        >
          <CourseTopbar
            title="Cybersecurity Awareness"
            subtitle="InfoSec · Required annual training · Syncs to Workday Learning"
            lessonCount={LESSONS.length}
            estimate="~17 min"
            chips={
              <>
                <span className="lms-chip lms-chip--warn">Due 30 Jun</span>
                <span className="lms-chip">All staff</span>
              </>
            }
          />

          <div className="lms-shell">
            <SidebarLessons
              lessons={LESSONS}
              step={step}
              setStep={setStep}
              footer={
                <>
                  <div className="lms-sidebar-footer">
                    <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(Math.min(last, step + 1))}
                      disabled={step === last}
                    >
                      Continue
                    </button>
                  </div>
                  <ThemeToggle mode={themeMode} onChange={setThemeMode} />
                </>
              }
            />

            <main className="lms-main">
              <ProgressTracker />
              <LessonIntro type={current.type} title={current.title} duration={current.duration} />

          {step === 0 ? (
            <Lesson title={LESSONS[0].title} lessonId={LESSONS[0].id}>
              <Scenario>
                <p>
                  Your manager assigned this module after a payroll-themed phishing wave. Acknowledge the
                  policy summary before starting the labs.
                </p>
              </Scenario>
              <AssignmentBrief />
            </Lesson>
          ) : null}

          {step === 1 ? (
            <Lesson title={LESSONS[1].title} lessonId={LESSONS[1].id}>
              <Scenario>
                <p>
                  You are covering the shared inbox while a teammate is out. Three messages arrived in
                  the last hour. Review authentication hints and choose the safest action for each.
                </p>
              </Scenario>
              <PhishingInbox />
            </Lesson>
          ) : null}

          {step === 2 ? (
            <Lesson title={LESSONS[2].title} lessonId={LESSONS[2].id}>
              <Scenario>
                <p>
                  During your commute, three texts arrive on your personal phone claiming to be from IT or
                  your bank. Treat them like work incidents—report through official channels.
                </p>
              </Scenario>
              <SmishingFeed />
            </Lesson>
          ) : null}

          {step === 3 ? (
            <Lesson title={LESSONS[3].title} lessonId={LESSONS[3].id}>
              <Scenario>
                <p>
                  A colleague messages you on Teams: their VPN token expired and payroll is due today.
                  They ask you to approve a reset link they were sent. Take your time—hints appear if
                  you need them.
                </p>
              </Scenario>
              <UrgentRequestScenario />
            </Lesson>
          ) : null}

          {step === 4 ? (
            <Lesson title={LESSONS[4].title} lessonId={LESSONS[4].id}>
              <Scenario>
                <p>
                  Your organization is rolling out passkeys and hardware security keys. Read the
                  policy summary, then note one habit you will adopt this week.
                </p>
              </Scenario>
              <CredentialHygiene />
            </Lesson>
          ) : null}

          {step === 5 ? (
            <Lesson title={LESSONS[5].title} lessonId={LESSONS[5].id}>
              <Scenario>
                <p>Confirm your understanding before returning to your LMS transcript.</p>
              </Scenario>
              <Quiz
                checkId="module-assessment-check"
                question="A vendor emails an invoice with a one-time payment link from an unfamiliar domain. What is the best first step?"
                choices={[
                  "Pay immediately to avoid late fees",
                  "Verify the request through your procurement portal or known contact",
                ]}
                answer="Verify the request through your procurement portal or known contact"
              />
              <FinishCourse />
            </Lesson>
          ) : null}
            </main>
          </div>
        </Course>
      </div>
    </ThemeProvider>
  );
}

function ThemeToggle(props: { mode: ThemeMode; onChange: (mode: ThemeMode) => void }) {
  return (
    <div className="lms-theme-toggle" role="group" aria-label="Display theme">
      {(["light", "dark", "system"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={props.mode === m}
          className={props.mode === m ? "lms-outline-active" : undefined}
          onClick={() => props.onChange(m)}
        >
          {m === "system" ? "System" : m === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </div>
  );
}

function AssignmentBrief() {
  const [ack, setAck] = React.useState(false);

  return (
    <section className="panel" aria-label="Assignment brief">
      <div className="callout policy-doc">
        <h3 className="section-title">Acceptable use — excerpt</h3>
        <p>
          Never share credentials, approve MFA prompts you did not initiate, or use payment links from email.
          Report suspicious messages to <strong>phish@company.example</strong> or the Outlook report button.
        </p>
        <p className="muted">Reference: INFOSEC-POL-014 (rev. March 2026)</p>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        I have read this excerpt and understand reporting expectations for my role.
      </label>
      {ack ? (
        <p className="lms-feedback lms-feedback--success" role="status">
          <strong>Ready for labs.</strong> Select Continue to open the email triage simulation.
        </p>
      ) : (
        <p className="muted">Check the box to unlock lab feedback in later lessons.</p>
      )}
    </section>
  );
}

type Email = {
  id: string;
  subject: string;
  from: string;
  authHint: string;
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
        authHint: "SPF: fail · DMARC: none · Reply-To differs from From",
        body: "Your deposit information will expire today. Confirm your bank details using the secure form.",
        isPhish: true,
      },
      {
        id: "e2",
        subject: "Q3 facilities walkthrough — notes attached",
        from: "Jordan Lee <jlee@company.example>",
        authHint: "SPF: pass · DMARC: pass · internal thread",
        body: "Slides from yesterday’s tour are in SharePoint. No action needed unless you spot a correction.",
        isPhish: false,
      },
      {
        id: "e3",
        subject: "Password reset requested for your account",
        from: "IT Service Desk <it-help@company.example>",
        authHint: "SPF: pass · sent via company mail gateway",
        body: "We received a reset request. If this was not you, contact the help desk extension 2200—do not use links in this message.",
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
      <div className="lms-score-card">
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
                  <div className="meta auth-hint">{e.authHint}</div>
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

type TextMessage = { id: string; sender: string; body: string; isSmish: boolean };

function SmishingFeed() {
  const { track } = useTracking();
  const [handled, setHandled] = React.useState<Record<string, "block" | "tap" | "call">>({});

  const messages: TextMessage[] = [
    {
      id: "t1",
      sender: "ALERT-8843",
      body: "Company IT: MFA device expired. Tap to re-register: https://it-reset-now.biz",
      isSmish: true,
    },
    {
      id: "t2",
      sender: "Chase Fraud",
      body: "Unusual charge $2,431. Reply YES to lock card. (Real banks never ask this way.)",
      isSmish: true,
    },
    {
      id: "t3",
      sender: "Mom",
      body: "Running late for dinner—can you pick up milk?",
      isSmish: false,
    },
  ];

  const act = (msg: TextMessage, action: "block" | "tap" | "call") => {
    setHandled((h) => ({ ...h, [msg.id]: action }));
    track("interaction", { kind: "smish_action", messageId: msg.id, action, isSmish: msg.isSmish });
  };

  const done = Object.keys(handled).length === messages.length;
  const safe = messages.every((m) => {
    const action = handled[m.id];
    if (!action) return false;
    if (m.isSmish) return action === "block";
    return action !== "tap";
  });

  return (
    <section className="panel lms-device-frame" aria-label="Smishing simulation">
      <p className="muted">Personal device — do not click unknown links; forward screenshots to phish@company.example.</p>
      <div className="sms-thread">
        {messages.map((m) => {
          const action = handled[m.id];
          return (
            <div key={m.id} className="sms-bubble">
              <div className="sms-from">{m.sender}</div>
              <p>{m.body}</p>
              <div className="actions">
                <button type="button" disabled={Boolean(action)} onClick={() => act(m, "block")}>
                  Block & report
                </button>
                <button type="button" disabled={Boolean(action)} onClick={() => act(m, "tap")}>
                  Open link
                </button>
                <button type="button" disabled={Boolean(action)} onClick={() => act(m, "call")}>
                  Call number back
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {done ? (
        <div className="callout" role="status">
          {safe ? (
            <>
              <strong>Good instincts.</strong> You avoided links on smishing texts and did not engage fraud alerts by SMS.
            </>
          ) : (
            <>
              <strong>Review SOC guidance.</strong> Treat unsolicited IT and bank texts as fraudulent; use official apps only.
            </>
          )}
        </div>
      ) : null}
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

      <div className="lms-chat-window">
        <div className="lms-chat-header">Microsoft Teams · Jordan Lee</div>
        <div className="lms-chat-body">
        <p>
          “Can you approve this reset? Payroll locks me out in 20 minutes and I’m stuck on a call.”
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
  const done = progress.completedLessonIds.size >= 5;

  return (
    <section aria-label="Complete course" className="panel">
      <p className="muted">
        When you have passed the assessment and visited earlier lessons, mark the module complete for your
        training record.
      </p>
      <button type="button" className="lms-btn-primary" onClick={() => completeCourse()} disabled={!done}>
        Mark module complete
      </button>
      {!done ? (
        <p className="muted">Complete the first five lessons, then pass the attestation above.</p>
      ) : null}
    </section>
  );
}

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
} from "@lessonkit/react";
import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIStatement } from "@lessonkit/xapi";
import { CourseTopbar, LessonIntro, SidebarLessons, type LessonMeta } from "../../_shared/course-ui";

const COURSE_ID = "customer-de-escalation";

const LESSONS: readonly LessonMeta[] = [
  { id: "channels", title: "Channels & QA", duration: "3 min", type: "Reading" },
  { id: "chat-listening", title: "Live chat", duration: "4 min", type: "Simulation" },
  { id: "phone-empathy", title: "Voice call", duration: "4 min", type: "Role-play" },
  { id: "solve-or-escalate", title: "Resolution paths", duration: "3 min", type: "Branching" },
  { id: "skills-check", title: "Skills check", duration: "2 min", type: "Assessment" },
];

export default function App() {
  const [step, setStep] = React.useState(0);

  const courseConfig = React.useMemo(
    () => ({
      tracking: { sink: (event: TelemetryEvent) => console.log("[telemetry]", event) },
      xapi: { transport: (statement: XAPIStatement) => console.log("[xapi]", statement) },
    }),
    [],
  );

  const last = LESSONS.length - 1;
  const current = LESSONS[step]!;

  return (
    <ThemeProvider mode="light" preset="brand">
      <div className="lms-app lms-theme-support">
        <Course title="Customer Care: De-escalation" courseId={COURSE_ID} config={courseConfig}>
          <CourseTopbar
            title="Customer Care: De-escalation"
            subtitle="North America Support · Wave 2 · Coaching-safe practice"
            lessonCount={LESSONS.length}
            estimate="~16 min"
            chips={<span className="lms-chip">QA cohort</span>}
          />

          <div className="lms-shell">
            <SidebarLessons
              lessons={LESSONS}
              step={step}
              setStep={setStep}
              title="Practice path"
              footer={
                <div className="lms-sidebar-footer">
                  <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(Math.min(last, step + 1))}
                    disabled={step === last}
                  >
                    Continue
                  </button>
                </div>
              }
            />

            <main className="lms-main">
              <ProgressTracker />
              <LessonIntro type={current.type} title={current.title} duration={current.duration} />

              {step === 0 ? (
                <Lesson title={LESSONS[0].title} lessonId={LESSONS[0].id}>
                  <ChannelBriefing />
                </Lesson>
              ) : null}

              {step === 1 ? (
                <Lesson title={LESSONS[1].title} lessonId={LESSONS[1].id}>
                  <Scenario>
                    <p>Queue: <strong>Billing · Priority</strong> · Customer: Alex M. · Case #448291</p>
                  </Scenario>
                  <ChatOpening />
                </Lesson>
              ) : null}

              {step === 2 ? (
                <Lesson title={LESSONS[2].title} lessonId={LESSONS[2].id}>
                  <Scenario>
                    <p>Voice channel — average handle time target 8:00. Customer has been on hold 4:12.</p>
                  </Scenario>
                  <PhoneEmpathy />
                </Lesson>
              ) : null}

              {step === 3 ? (
                <Lesson title={LESSONS[3].title} lessonId={LESSONS[3].id}>
                  <Scenario>
                    <p>Part ships tomorrow but the customer missed a client deadline. Choose how to close the loop.</p>
                  </Scenario>
                  <EscalationBranch />
                </Lesson>
              ) : null}

              {step === 4 ? (
                <Lesson title={LESSONS[4].title} lessonId={LESSONS[4].id}>
                  <Scenario>
                    <p>Supervisor review before returning to queue.</p>
                  </Scenario>
                  <Quiz
                    checkId="de-escalation-check"
                    question="A customer threatens chargebacks unless you waive a non-refundable policy. Best action?"
                    choices={[
                      "Waive immediately to protect CSAT",
                      "Stay calm, restate policy, warm-transfer to a supervisor if threats continue",
                    ]}
                    answer="Stay calm, restate policy, warm-transfer to a supervisor if threats continue"
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

function ChannelBriefing() {
  return (
    <section className="panel">
      <div className="channel-grid">
        <article className="channel-card">
          <h3>Live chat</h3>
          <ul>
            <li>Target first response: 45s</li>
            <li>Use short acknowledgments before macros</li>
            <li>Never paste policy walls without context</li>
          </ul>
        </article>
        <article className="channel-card">
          <h3>Voice</h3>
          <ul>
            <li>Let silence breathe after upset statements</li>
            <li>Name the emotion, then the next step</li>
            <li>Warm-transfer with a 10-second bridge</li>
          </ul>
        </article>
      </div>
      <div className="qa-snippet">
        <p className="muted">QA clip — avoid:</p>
        <blockquote>“That’s policy. There’s nothing I can do.”</blockquote>
        <p className="muted">Prefer:</p>
        <blockquote>“I can see why that’s frustrating. Here’s what I <em>can</em> do right now…”</blockquote>
      </div>
    </section>
  );
}

function ChatBubble(props: { who: "customer" | "agent"; children: React.ReactNode }) {
  return (
    <div className={`chat-row chat-${props.who}`}>
      <div className="chat-bubble">{props.children}</div>
    </div>
  );
}

function ChatOpening() {
  const { track } = useTracking();
  const [choice, setChoice] = React.useState<"deflect" | "reflect" | "blame" | null>(null);

  const pick = (c: "deflect" | "reflect" | "blame") => {
    setChoice(c);
    track("interaction", { kind: "chat_opening", choice: c });
  };

  return (
    <section className="panel chat-panel" aria-label="Live chat simulation">
      <div className="lms-chat-window">
        <div className="lms-chat-header">Zendesk · Alex M. · Case #448291 · Priority</div>
        <div className="lms-chat-body chat-log">
        <ChatBubble who="customer">
          This is the 4th agent today. Nobody reads my notes. I want a supervisor NOW.
        </ChatBubble>
        <ChatBubble who="customer">
          Replacement part was promised Monday. It’s Thursday.
        </ChatBubble>
        </div>
      </div>
      <p className="muted">Your reply:</p>
      <div className="actions">
        <button type="button" disabled={choice !== null} onClick={() => pick("deflect")}>
          Policy says 5–7 business days—you’re still in window.
        </button>
        <button type="button" disabled={choice !== null} onClick={() => pick("reflect")}>
          I’m sorry you’ve been passed around—I’m reading case #448291 with you now.
        </button>
        <button type="button" disabled={choice !== null} onClick={() => pick("blame")}>
          Warehouse delays aren’t something we control on chat.
        </button>
      </div>
      {choice ? (
        <ChatBubble who="agent">
          {choice === "reflect" ? (
            <>
              <strong>Coach:</strong> Good—reflect before policy. Offer a concrete next step within 2 messages.
            </>
          ) : (
            <>
              <strong>Coach:</strong> Policy-first replies increased escalations 18% in last month’s QA.
            </>
          )}
        </ChatBubble>
      ) : null}
    </section>
  );
}

function PhoneEmpathy() {
  const { track } = useTracking();
  const [pace, setPace] = React.useState<"rush" | "pause" | null>(null);
  const [phrase, setPhrase] = React.useState<string | null>(null);

  const phrases = [
    { id: "a", text: "Sir, you need to calm down so I can help.", good: false },
    { id: "b", text: "I hear the shipment miss cost you a client—that’s serious. Let’s fix what we can today.", good: true },
    { id: "c", text: "You should have paid for express if timing mattered.", good: false },
  ];

  return (
    <section className="panel phone-panel" aria-label="Voice simulation">
      <div className="hold-timer" role="status">
        Hold time: <strong>4:12</strong> · Target AHT 8:00
      </div>
      <p className="script muted">Customer (upset): “Your tracking link shows ‘label created’ for three days!”</p>
      <p className="muted">Before looking up tracking, choose pacing:</p>
      <div className="actions">
        <button type="button" disabled={pace !== null} onClick={() => setPace("rush")}>
          Jump straight to tracking while they talk
        </button>
        <button
          type="button"
          disabled={pace !== null}
          onClick={() => {
            setPace("pause");
            track("interaction", { kind: "phone_pace", pace: "pause" });
          }}
        >
          Pause, acknowledge, then ask permission to place on brief hold
        </button>
      </div>
      {pace === "pause" ? (
        <>
          <p className="muted">Pick empathetic phrasing:</p>
          {phrases.map((o) => (
            <button
              key={o.id}
              type="button"
              className="phrase-option"
              disabled={phrase !== null}
              onClick={() => {
                setPhrase(o.id);
                track("interaction", { kind: "phone_phrase", id: o.id, good: o.good });
              }}
            >
              {o.text}
            </button>
          ))}
        </>
      ) : pace === "rush" ? (
        <p className="callout" role="status">
          Customers perceived rushing during hold—coaching recommends acknowledge-then-hold.
        </p>
      ) : null}
      {phrase ? (
        <p className="callout" role="status">
          {phrases.find((p) => p.id === phrase)?.good
            ? "Validates impact without admitting liability—ready for tracking review."
            : "Avoid ‘calm down’ and blame—try the reflective option."}
        </p>
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
      <section className="panel chat-panel">
        <div className="chat-log">
          <ChatBubble who="customer">Tomorrow doesn’t help—I lost a client. What are you going to do?</ChatBubble>
        </div>
        <div className="actions">
          <button type="button" onClick={() => choose("credit", "shipping_credit")}>
            Offer shipping credit + proactive tracking updates
          </button>
          <button type="button" onClick={() => choose("supervisor", "supervisor_early")}>
            Warm-transfer to supervisor for goodwill review
          </button>
        </div>
      </section>
    );
  }

  if (stage === "credit") {
    return (
      <section className="panel">
        <div className="callout" role="status">
          <strong>Tier-1 resolution.</strong> Document credit code, set callback, and tag case to prevent re-queue.
        </div>
        <Reflection prompt="Write the one-sentence case note the next agent should see first." />
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
          <strong>Appropriate escalation.</strong> Stay on the line until the supervisor joins—no cold transfer.
        </div>
        <button type="button" onClick={() => setStage("done")}>
          Continue
        </button>
      </section>
    );
  }

  return <p className="muted">Resolution path complete—open the skills check.</p>;
}

function FinishCourse() {
  const { progress } = useLessonkit();
  const { completeCourse } = useCompletion();
  const done = progress.completedLessonIds.size >= 4;

  return (
    <section className="panel">
      <button type="button" className="lms-btn-primary" onClick={() => completeCourse()} disabled={!done}>
        Return to queue
      </button>
      {!done ? <p className="muted">Finish all practice steps and pass the skills check.</p> : null}
    </section>
  );
}

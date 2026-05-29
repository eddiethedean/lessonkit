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

const COURSE_ID = "data-privacy-essentials";

const LESSONS: readonly LessonMeta[] = [
  { id: "program-overview", title: "Program overview", duration: "2 min", type: "Reading" },
  { id: "lawful-basis", title: "Lawful basis", duration: "4 min", type: "Interactive" },
  { id: "case-studies", title: "Case file review", duration: "3 min", type: "Review" },
  { id: "data-minimization", title: "Minimization lab", duration: "3 min", type: "Lab" },
  { id: "incident-tabletop", title: "Incident tabletop", duration: "4 min", type: "Simulation" },
  { id: "certification", title: "Certification", duration: "2 min", type: "Assessment" },
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
    <ThemeProvider mode="light" preset="default">
      <div className="lms-app lms-theme-compliance">
        <Course title="Data Privacy & GDPR Essentials" courseId={COURSE_ID} config={courseConfig}>
          <CourseTopbar
            title="Data Privacy & GDPR Essentials"
            subtitle="Legal & Compliance · EU / UK · Binding Corporate Rules"
            lessonCount={LESSONS.length}
            estimate="~18 min"
            chips={
              <>
                <span className="lms-chip">Certificate on pass</span>
                <span className="lms-chip">Microlearning</span>
              </>
            }
          />

          <div className="lms-shell">
            <SidebarLessons
              lessons={LESSONS}
              step={step}
              setStep={setStep}
              title="Learning path"
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
                  <ProgramOverview />
                </Lesson>
              ) : null}

              {step === 1 ? (
                <Lesson title={LESSONS[1].title} lessonId={LESSONS[1].id}>
                  <Scenario>
                    <p>
                      Match each processing activity to the most appropriate lawful basis under GDPR Art. 6.
                      Your DPO reviewed these examples for onboarding.
                    </p>
                  </Scenario>
                  <LawfulBasisLab />
                </Lesson>
              ) : null}

              {step === 2 ? (
                <Lesson title={LESSONS[2].title} lessonId={LESSONS[2].id}>
                  <Scenario>
                    <p>
                      Audit samples from Q1. Each card lists the business unit and data subjects involved.
                    </p>
                  </Scenario>
                  <PrivacyCases />
                </Lesson>
              ) : null}

              {step === 3 ? (
                <Lesson title={LESSONS[3].title} lessonId={LESSONS[3].id}>
                  <Scenario>
                    <p>
                      Choose your role, then trim the event registration form. HR and Marketing have different
                      legitimate needs.
                    </p>
                  </Scenario>
                  <MinimizationLab />
                </Lesson>
              ) : null}

              {step === 4 ? (
                <Lesson title={LESSONS[4].title} lessonId={LESSONS[4].id}>
                  <Scenario>
                    <p>
                      Tabletop: a vendor uploads a customer export to the wrong SharePoint site at 09:12. Work
                      through the first 60 minutes.
                    </p>
                  </Scenario>
                  <IncidentTabletop />
                </Lesson>
              ) : null}

              {step === 5 ? (
                <Lesson title={LESSONS[5].title} lessonId={LESSONS[5].id}>
                  <Scenario>
                    <p>Attestation for your training transcript.</p>
                  </Scenario>
                  <Quiz
                    checkId="privacy-knowledge-check"
                    question="A sales director asks for all EU prospect emails on a personal USB drive for a flight. What is the correct response?"
                    choices={[
                      "Export and hand off—they are a director",
                      "Refuse; offer a governed analytics export with DPO-approved scope",
                    ]}
                    answer="Refuse; offer a governed analytics export with DPO-approved scope"
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

function ProgramOverview() {
  return (
    <section className="panel">
      <div className="instructor-note lms-feedback lms-feedback--info">
        <strong>Instructor note</strong>
        <p>This module does not replace legal advice. Contact privacy@company.example for DPIAs.</p>
      </div>
      <h3 className="section-title">Learning objectives</h3>
      <ul className="objectives">
        <li>Map everyday processing to lawful bases</li>
        <li>Judge escalations using case context (volume, sensitivity)</li>
        <li>Execute first-hour steps for a personal-data incident</li>
      </ul>
      <div className="callout">
        <p>
          <strong>Personal data</strong> is any information relating to an identified or identifiable person—including
          work email, device IDs, and photos of badges.
        </p>
      </div>
    </section>
  );
}

const BASIS_OPTIONS = ["Contract", "Legitimate interest", "Consent", "Legal obligation"] as const;

const BASIS_SCENARIOS = [
  {
    id: "b1",
    text: "Payroll runs monthly salary transfers for employees.",
    answer: "Contract" as const,
  },
  {
    id: "b2",
    text: "Marketing sends a newsletter only to contacts who opted in on the website form.",
    answer: "Consent" as const,
  },
  {
    id: "b3",
    text: "Finance retains invoices for seven years per tax law.",
    answer: "Legal obligation" as const,
  },
] as const;

function LawfulBasisLab() {
  const { track } = useTracking();
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  const pick = (id: string, basis: string, expected: string) => {
    setAnswers((a) => ({ ...a, [id]: basis }));
    track("interaction", { kind: "lawful_basis", id, basis, correct: basis === expected });
  };

  const done = Object.keys(answers).length === BASIS_SCENARIOS.length;
  const score = BASIS_SCENARIOS.filter((s) => answers[s.id] === s.answer).length;

  return (
    <section className="panel" aria-label="Lawful basis lab">
      {BASIS_SCENARIOS.map((s) => (
        <article key={s.id} className="card">
          <p className="body">{s.text}</p>
          <div className="basis-grid">
            {BASIS_OPTIONS.map((b) => (
              <button
                key={b}
                type="button"
                disabled={Boolean(answers[s.id])}
                className={answers[s.id] === b ? "basis-selected" : undefined}
                onClick={() => pick(s.id, b, s.answer)}
              >
                {b}
              </button>
            ))}
          </div>
        </article>
      ))}
      {done ? (
        <p className="callout" role="status">
          <strong>
            {score}/{BASIS_SCENARIOS.length} correct.
          </strong>{" "}
          Misclassification can invalidate processing—when unsure, open a privacy ticket.
        </p>
      ) : null}
    </section>
  );
}

type CaseStudy = {
  id: string;
  title: string;
  unit: string;
  detail: string;
  acceptable: boolean;
};

function PrivacyCases() {
  const { track } = useTracking();
  const [verdicts, setVerdicts] = React.useState<Record<string, "ok" | "escalate">>({});

  const cases: CaseStudy[] = [
    {
      id: "c1",
      title: "Misdirected campaign test",
      unit: "Marketing · 12,400 recipients",
      detail: "A/B test email used production list instead of sandbox. Two opens logged before pause.",
      acceptable: false,
    },
    {
      id: "c2",
      title: "Anonymised engagement metrics",
      unit: "Product · no direct identifiers",
      detail: "Dashboard shows aggregated click rates by region; minimum group size 50.",
      acceptable: true,
    },
    {
      id: "c3",
      title: "Offboarding archive",
      unit: "IT · former contractor laptops",
      detail: "Devices wiped per SOX retention schedule after legal hold cleared.",
      acceptable: true,
    },
  ];

  const judge = (c: CaseStudy, verdict: "ok" | "escalate") => {
    setVerdicts((prev) => ({ ...prev, [c.id]: verdict }));
    track("interaction", {
      kind: "privacy_case",
      caseId: c.id,
      verdict,
      correct: verdict === (c.acceptable ? "ok" : "escalate"),
    });
  };

  const done = Object.keys(verdicts).length === cases.length;

  return (
    <section className="panel" aria-label="Case files">
      {cases.map((c) => {
        const v = verdicts[c.id];
        return (
          <div key={c.id} className="card case-file">
            <div className="case-meta">{c.unit}</div>
            <div className="subject">{c.title}</div>
            <p className="body">{c.detail}</p>
            <div className="actions">
              <button type="button" onClick={() => judge(c, "ok")} disabled={Boolean(v)}>
                Acceptable
              </button>
              <button type="button" onClick={() => judge(c, "escalate")} disabled={Boolean(v)}>
                Escalate to DPO
              </button>
            </div>
          </div>
        );
      })}
      {done ? (
        <p className="callout" role="status">
          Document your rationale in the case system—regulators ask <em>why</em> you decided, not only <em>what</em>.
        </p>
      ) : null}
    </section>
  );
}

const ROLE_FIELDS: Record<
  "hr" | "marketing",
  { id: string; label: string; needed: boolean }[]
> = {
  hr: [
    { id: "name", label: "Full name", needed: true },
    { id: "email", label: "Work email", needed: true },
    { id: "diet", label: "Dietary needs (health data—minimize)", needed: false },
    { id: "emergency", label: "Emergency contact & relationship", needed: true },
    { id: "ssn", label: "National ID number", needed: false },
  ],
  marketing: [
    { id: "name", label: "Full name", needed: true },
    { id: "email", label: "Work email", needed: true },
    { id: "company", label: "Company & job title", needed: true },
    { id: "linkedin", label: "LinkedIn profile URL", needed: false },
    { id: "birth", label: "Date of birth", needed: false },
  ],
};

function MinimizationLab() {
  const { track } = useTracking();
  const [role, setRole] = React.useState<"hr" | "marketing">("hr");
  const fields = ROLE_FIELDS[role];
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(fields.map((f) => f.id)),
  );

  React.useEffect(() => {
    setSelected(new Set(ROLE_FIELDS[role].map((f) => f.id)));
  }, [role]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const unnecessary = fields.filter((f) => selected.has(f.id) && !f.needed).map((f) => f.id);
  const missing = fields.filter((f) => f.needed && !selected.has(f.id)).map((f) => f.id);
  const ready = unnecessary.length === 0 && missing.length === 0;

  React.useEffect(() => {
    if (ready) track("interaction", { kind: "form_minimized", role, fields: [...selected] });
  }, [ready, role, selected, track]);

  return (
    <section className="panel" aria-label="Minimization lab">
      <div className="role-switch" role="group" aria-label="Your role">
        <button type="button" aria-pressed={role === "hr"} onClick={() => setRole("hr")}>
          HR coordinator
        </button>
        <button type="button" aria-pressed={role === "marketing"} onClick={() => setRole("marketing")}>
          Marketing events
        </button>
      </div>
      <p className="muted">
        {role === "hr"
          ? "Wellness lunch registration—collect only what occupational health requires."
          : "Leadership dinner—avoid social data unless there is a documented purpose."}
      </p>
      <div className="callout">
        {fields.map((f) => (
          <label key={f.id} className="checkbox-row">
            <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggle(f.id)} />
            {f.label}
          </label>
        ))}
      </div>
      {ready ? (
        <p className="callout" role="status">
          <strong>Appropriate for {role === "hr" ? "HR" : "Marketing"}.</strong> Record the purpose in the privacy
          register before go-live.
        </p>
      ) : (
        <p className="muted" role="status">
          {missing.length > 0
            ? `Required: ${missing.join(", ")}`
            : `Remove: ${unnecessary.join(", ")}`}
        </p>
      )}
    </section>
  );
}

const TABLETOP_STEPS = [
  { id: "s1", order: 1, label: "09:15 — Revoke external sharing link" },
  { id: "s2", order: 2, label: "09:20 — Open Sev-2 ticket with Privacy & Security" },
  { id: "s3", order: 3, label: "09:35 — Draft affected-data inventory (subjects, fields)" },
  { id: "s4", order: 4, label: "09:40 — Post file names in #general for transparency" },
] as const;

function IncidentTabletop() {
  const { track } = useTracking();
  const [order, setOrder] = React.useState<string[]>([]);

  const pickNext = (id: string) => {
    if (order.includes(id)) return;
    setOrder((o) => [...o, id]);
    track("interaction", { kind: "tabletop_step", id, position: order.length + 1 });
  };

  const ideal = ["s1", "s2", "s3"];
  const aligned = order.length === 3 && order.every((id, i) => id === ideal[i]);

  return (
    <section className="panel" aria-label="Incident tabletop">
      <p className="muted">Select actions in the order you would perform them (first three only).</p>
      <div className="timeline">
        {TABLETOP_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={order.includes(s.id) || order.length >= 3}
            onClick={() => pickNext(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {order.length === 3 ? (
        aligned ? (
          <>
            <p className="callout" role="status">
              <strong>Sequence matches playbook.</strong> Skip public channels until comms approves messaging.
            </p>
            <Reflection prompt="Who is your local Privacy Incident Commander (name or role)?" />
          </>
        ) : (
          <p className="callout" role="status">
            Contain → notify → document. Posting filenames publicly can worsen exposure.
          </p>
        )
      ) : (
        <p className="muted">Selected: {order.length}/3</p>
      )}
    </section>
  );
}

function FinishCourse() {
  const { progress } = useLessonkit();
  const { completeCourse } = useCompletion();
  const done = progress.completedLessonIds.size >= 5;

  return (
    <section className="panel">
      <button type="button" className="lms-btn-primary" onClick={() => completeCourse()} disabled={!done}>
        Record certification
      </button>
      {!done ? <p className="muted">Complete all prior sections and pass the attestation.</p> : null}
    </section>
  );
}

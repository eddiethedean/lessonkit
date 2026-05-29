import React from "react";
import {
  Course,
  Lesson,
  ProgressTracker,
  Quiz,
  Reflection,
  Scenario,
  ThemeProvider,
  useTracking,
} from "@lessonkit/react";

const COURSE_ID = "workplace-safety-briefing";

const STEPS = [
  { id: "welcome", title: "Site orientation" },
  { id: "ppe-check", title: "PPE fit & sign-off" },
  { id: "hazard-walkthrough", title: "Floor walk" },
  { id: "safety-check", title: "Sign-off & near-miss" },
] as const;

export default function App() {
  const [step, setStep] = React.useState(0);
  const progressPct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <ThemeProvider preset="brand" mode="light">
      <div className="app-shell">
        <Course title="Workplace Safety: Warehouse Briefing" courseId={COURSE_ID}>
          <header className="course-header">
            <p className="eyebrow">DC-14 · New hire · Day 1</p>
            <p className="muted">
              Supervisor: <strong>M. Okonkwo</strong> · Estimated time 12 minutes · Valid 12 months
            </p>
            <div className="progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </header>

          <ProgressTracker />

          <nav className="lesson-nav" aria-label="Lessons">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-current={step === i ? "step" : undefined}
                className={step === i ? "active" : undefined}
                onClick={() => setStep(i)}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </nav>

          {step === 0 ? (
            <Lesson title={STEPS[0].title} lessonId={STEPS[0].id}>
              <Scenario>
                <p>
                  Before your badge activates for Zone B, confirm you understand emergency procedures and
                  reporting lines for this distribution center.
                </p>
              </Scenario>
              <ul className="checklist">
                <li>Mustard point: Assembly Area C (north parking row 4)</li>
                <li>Spill hotline: x4911 · radio channel WH-2</li>
                <li>Powered industrial trucks always yield to pedestrians</li>
                <li>Steel-toe + hi-vis vest required past the yellow line</li>
              </ul>
              <div className="figure-callout">
                <p className="figure-label">Figure 1 — Pedestrian lane (keep right, no earbuds)</p>
                <p className="muted">Instructor-led walk occurs after this module.</p>
              </div>
            </Lesson>
          ) : null}

          {step === 1 ? (
            <Lesson title={STEPS[1].title} lessonId={STEPS[1].id}>
              <Scenario>
                <p>
                  PPE station 3. Confirm fit for your shift. If equipment is damaged, swap at the cage before
                  entering the floor.
                </p>
              </Scenario>
              <PpeSignOff />
            </Lesson>
          ) : null}

          {step === 2 ? (
            <Lesson title={STEPS[2].title} lessonId={STEPS[2].id}>
              <Scenario>
                <p>
                  Photo walk: three situations from yesterday’s tour. Mark whether the scene is safe as shown or
                  needs correction.
                </p>
              </Scenario>
              <HazardWalkthrough />
            </Lesson>
          ) : null}

          {step === 3 ? (
            <Lesson title={STEPS[3].title} lessonId={STEPS[3].id}>
              <Scenario>
                <p>Knowledge check, then log a hypothetical near-miss the way you would on the floor.</p>
              </Scenario>
              <Quiz
                checkId="safety-check"
                question="You notice an unmarked wet floor near a blind corner. What should you do first?"
                choices={[
                  "Walk quickly past before someone else slips",
                  "Barricade the area and notify your supervisor",
                ]}
                answer="Barricade the area and notify your supervisor"
              />
              <NearMissForm />
              <Reflection prompt="Where is your assigned muster point if the fire alarm sounds?" />
            </Lesson>
          ) : null}
        </Course>
      </div>
    </ThemeProvider>
  );
}

function PpeSignOff() {
  const { track } = useTracking();
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});

  const items = [
    { id: "boots", label: "Steel-toe boots laced and tongue covered" },
    { id: "vest", label: "Hi-vis vest fastened (no tears)" },
    { id: "gloves", label: "Cut-resistant gloves sized correctly" },
  ];

  const toggle = (id: string) => {
    setChecks((c) => {
      const next = { ...c, [id]: !c[id] };
      track("interaction", { kind: "ppe_check", id, checked: next[id] });
      return next;
    });
  };

  const allChecked = items.every((i) => checks[i.id]);

  return (
    <section className="panel" aria-label="PPE sign-off">
      {items.map((i) => (
        <label key={i.id} className="ppe-row">
          <input type="checkbox" checked={Boolean(checks[i.id])} onChange={() => toggle(i.id)} />
          {i.label}
        </label>
      ))}
      {allChecked ? (
        <p className="feedback" role="status">
          PPE sign-off recorded for shift 06:00–14:00. Proceed to the floor walk.
        </p>
      ) : (
        <p className="muted">Supervisor cannot release badge until all items are confirmed.</p>
      )}
    </section>
  );
}

type Hazard = { id: string; label: string; detail: string; figure: string; correct: "safe" | "unsafe" };

function HazardWalkthrough() {
  const { track } = useTracking();
  const hazards: Hazard[] = [
    {
      id: "h1",
      label: "Pallet leaning into walkway",
      figure: "Photo A — aisle 7B",
      detail: "Stack blocks half the pedestrian lane beside an active forklift route.",
      correct: "unsafe",
    },
    {
      id: "h2",
      label: "Cord covers installed",
      figure: "Photo B — charging bay",
      detail: "Yellow covers secure charging cables along the wall.",
      correct: "safe",
    },
    {
      id: "h3",
      label: "Open chemical container",
      figure: "Photo C — east exit",
      detail: "Cleaning solution left uncapped beside an emergency door.",
      correct: "unsafe",
    },
  ];

  const [answers, setAnswers] = React.useState<Record<string, "safe" | "unsafe">>({});

  const answer = (h: Hazard, choice: "safe" | "unsafe") => {
    setAnswers((a) => ({ ...a, [h.id]: choice }));
    track("interaction", { kind: "hazard", id: h.id, choice, correct: choice === h.correct });
  };

  const score = hazards.filter((h) => answers[h.id] === h.correct).length;
  const done = Object.keys(answers).length === hazards.length;

  return (
    <section className="panel" aria-label="Hazard walkthrough">
      {hazards.map((h) => (
        <article key={h.id} className="hazard-card">
          <p className="figure-label">{h.figure}</p>
          <h3>{h.label}</h3>
          <p>{h.detail}</p>
          <div className="actions">
            <button type="button" disabled={Boolean(answers[h.id])} onClick={() => answer(h, "safe")}>
              Safe as shown
            </button>
            <button type="button" disabled={Boolean(answers[h.id])} onClick={() => answer(h, "unsafe")}>
              Report / fix needed
            </button>
          </div>
        </article>
      ))}
      {done ? (
        <p className="feedback" role="status">
          {score} of {hazards.length} correct. Near-misses include “almost” hits—report them early.
        </p>
      ) : null}
    </section>
  );
}

function NearMissForm() {
  const { track } = useTracking();
  const [location, setLocation] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    setSubmitted(true);
    track("interaction", { kind: "near_miss", location: location.trim() });
  };

  return (
    <section className="panel near-miss" aria-label="Near-miss report">
      <p className="muted">Practice entry (not sent to production systems):</p>
      <form onSubmit={submit}>
        <label>
          Location / aisle
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Aisle 12, dock door 3"
            disabled={submitted}
          />
        </label>
        <button type="submit" disabled={submitted || !location.trim()}>
          Submit practice report
        </button>
      </form>
      {submitted ? (
        <p className="feedback" role="status">
          In production this creates ticket SAF-### for supervisor review within one shift.
        </p>
      ) : null}
    </section>
  );
}

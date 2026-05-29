import React from "react";
import {
  Course,
  Lesson,
  ProgressTracker,
  Quiz,
  Reflection,
  Scenario,
  ThemeProvider,
} from "@lessonkit/react";

const COURSE_ID = "workplace-safety-briefing";

const STEPS = [
  { id: "welcome", title: "Welcome & objectives" },
  { id: "hazard-walkthrough", title: "Warehouse hazard walkthrough" },
  { id: "safety-check", title: "Safety knowledge check" },
] as const;

export default function App() {
  const [step, setStep] = React.useState(0);

  return (
    <ThemeProvider preset="brand" mode="light">
      <div className="app-shell">
        <Course title="Workplace Safety: Warehouse Briefing" courseId={COURSE_ID}>
          <header className="course-header">
            <p className="eyebrow">New hire orientation · 8 minutes</p>
            <p className="muted">
              This module covers slip/trip hazards, PPE expectations, and how to report near-misses before
              your first shift on the floor.
            </p>
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
                {s.title}
              </button>
            ))}
          </nav>

          {step === 0 ? (
            <Lesson title={STEPS[0].title} lessonId={STEPS[0].id}>
              <Scenario>
                <p>
                  Before entering the floor, every associate must acknowledge site rules and emergency
                  exits. Read the summary below, then continue to the walkthrough.
                </p>
              </Scenario>
              <ul className="checklist">
                <li>Steel-toe boots and high-visibility vest required in Zone B</li>
                <li>Powered equipment always yields to pedestrians</li>
                <li>Report spills and near-misses within 15 minutes</li>
              </ul>
            </Lesson>
          ) : null}

          {step === 1 ? (
            <Lesson title={STEPS[1].title} lessonId={STEPS[1].id}>
              <Scenario>
                <p>
                  You are escorted through an aisle with three situations. Select the safest response for
                  each before proceeding to the knowledge check.
                </p>
              </Scenario>
              <HazardWalkthrough />
            </Lesson>
          ) : null}

          {step === 2 ? (
            <Lesson title={STEPS[2].title} lessonId={STEPS[2].id}>
              <Scenario>
                <p>Confirm you can apply today’s briefing on the job.</p>
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
              <Reflection prompt="Where is your assigned muster point if the fire alarm sounds?" />
            </Lesson>
          ) : null}
        </Course>
      </div>
    </ThemeProvider>
  );
}

type Hazard = { id: string; label: string; detail: string; correct: "safe" | "unsafe" };

function HazardWalkthrough() {
  const hazards: Hazard[] = [
    {
      id: "h1",
      label: "Pallet leaning into walkway",
      detail: "A stack blocks half the aisle near a forklift lane.",
      correct: "unsafe",
    },
    {
      id: "h2",
      label: "Cord covers installed",
      detail: "Yellow covers secure charging cables along the wall.",
      correct: "safe",
    },
    {
      id: "h3",
      label: "Open chemical container",
      detail: "Cleaning solution left uncapped beside an exit.",
      correct: "unsafe",
    },
  ];

  const [answers, setAnswers] = React.useState<Record<string, "safe" | "unsafe">>({});

  const score = hazards.filter((h) => answers[h.id] === h.correct).length;
  const done = Object.keys(answers).length === hazards.length;

  return (
    <section className="panel" aria-label="Hazard walkthrough">
      {hazards.map((h) => (
        <article key={h.id} className="hazard-card">
          <h3>{h.label}</h3>
          <p>{h.detail}</p>
          <div className="actions">
            <button
              type="button"
              disabled={Boolean(answers[h.id])}
              onClick={() => setAnswers((a) => ({ ...a, [h.id]: "safe" }))}
            >
              Safe as shown
            </button>
            <button
              type="button"
              disabled={Boolean(answers[h.id])}
              onClick={() => setAnswers((a) => ({ ...a, [h.id]: "unsafe" }))}
            >
              Report / fix needed
            </button>
          </div>
        </article>
      ))}
      {done ? (
        <p className="feedback" role="status">
          You identified {score} of {hazards.length} situations correctly. Continue to the knowledge check.
        </p>
      ) : null}
    </section>
  );
}

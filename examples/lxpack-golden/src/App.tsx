import React from "react";
import { Course, Lesson, ProgressTracker, Quiz, Scenario, ThemeProvider } from "@lessonkit/react";

const COURSE_ID = "lxpack-golden";

export default function App() {
  const [step, setStep] = React.useState(0);

  return (
    <ThemeProvider preset="brand" mode="light">
      <div className="app-shell">
        <Course title="LXPack Golden Course" courseId={COURSE_ID}>
          <ProgressTracker />
          <nav aria-label="Lessons">
            <button type="button" onClick={() => setStep(0)}>
              Intro
            </button>
            <button type="button" onClick={() => setStep(1)}>
              Check
            </button>
          </nav>

          {step === 0 ? (
            <Lesson title="Introduction" lessonId="intro">
              <Scenario>
                <p>Welcome. Complete this lesson, then open the knowledge check.</p>
              </Scenario>
            </Lesson>
          ) : null}

          {step === 1 ? (
            <Lesson title="Knowledge check" lessonId="check">
              <Scenario>
                <p>Confirm you reviewed the introduction.</p>
              </Scenario>
              <Quiz
                checkId="ready-check"
                question="Did you complete the intro?"
                choices={["No", "Yes"]}
                answer="Yes"
              />
            </Lesson>
          ) : null}
        </Course>
      </div>
    </ThemeProvider>
  );
}

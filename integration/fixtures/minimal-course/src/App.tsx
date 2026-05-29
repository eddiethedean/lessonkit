import React from "react";
import { Course, Lesson, Quiz, Scenario, ThemeProvider } from "@lessonkit/react";
import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIStatement } from "@lessonkit/xapi";

const courseConfig = {
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
} as const;

export default function App() {
  return (
    <ThemeProvider preset="default" mode="light">
      <div className="app-shell">
        <Course title="Minimal Integration Course" courseId="minimal-course" config={courseConfig}>
          <Lesson title="Lesson one" lessonId="lesson-1">
            <Scenario>
              <p>Integration fixture content.</p>
            </Scenario>
            <Quiz
              checkId="ready-to-build"
              question="Ready to build?"
              choices={["Not yet", "Yes"]}
              answer="Yes"
            />
          </Lesson>
        </Course>
      </div>
    </ThemeProvider>
  );
}

import React from "react";
import { Course, Lesson, ProgressTracker, Quiz, Scenario } from "@lessonkit/react";
import { createXAPIClient } from "@lessonkit/xapi";
import type { TelemetryEvent } from "@lessonkit/core";

export default function App() {
  return (
    <div className="app-shell">
      <Course
        title="Cybersecurity Basics"
        courseId="cyber-basics"
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

        <Lesson title="Phishing Awareness" lessonId="phishing-101">
          <Scenario>
            <p>You receive a suspicious email asking you to open an attachment.</p>
          </Scenario>

          <Quiz
            question="What should you do first?"
            choices={["Open attachment", "Verify sender"]}
            answer="Verify sender"
          />
        </Lesson>
      </Course>
    </div>
  );
}


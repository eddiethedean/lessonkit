import React from "react";
import { Course, Lesson, ProgressTracker, Quiz, Scenario } from "@lessonkit/react";

export default function App() {
  return (
    <div className="app-shell">
      <Course title="Cybersecurity Basics" courseId="cyber-basics">
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


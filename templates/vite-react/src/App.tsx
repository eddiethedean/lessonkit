import React from "react";
import { Course, Lesson, Quiz, Scenario } from "@lessonkit/react";
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
    <Course title="My LessonKit Course" courseId="my-course" config={courseConfig}>
      <Lesson title="My first lesson" lessonId="lesson-1">
        <Scenario>
          <p>Replace this content with your training material.</p>
        </Scenario>

        <Quiz
          question="Ready to build?"
          choices={["Not yet", "Yes"]}
          answer="Yes"
        />
      </Lesson>
    </Course>
  );
}

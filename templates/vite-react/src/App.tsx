import React from "react";
import { Course, Lesson, Quiz, Scenario } from "@lessonkit/react";
import { createXAPIClient } from "@lessonkit/xapi";
import type { TelemetryEvent } from "@lessonkit/core";

export default function App() {
  return (
    <Course
      title="My LessonKit Course"
      courseId="my-course"
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


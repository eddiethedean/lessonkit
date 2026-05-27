import React from "react";
import { Course, Lesson, Quiz, Scenario } from "@lessonkit/react";

export default function App() {
  return (
    <Course title="My LessonKit Course" courseId="my-course">
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


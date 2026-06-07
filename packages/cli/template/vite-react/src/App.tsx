import React from "react";
import { Course, Lesson, Quiz, Scenario, ThemeProvider } from "@lessonkit/react";
import { createCourseConfig, COURSE_THEME_PRESET } from "./courseConfig";

const courseConfig = createCourseConfig();

export default function App() {
  return (
    <ThemeProvider preset={COURSE_THEME_PRESET} mode="light">
      <div className="app-shell">
        <Course title="{{courseTitle}}" courseId="my-course" config={courseConfig}>
          <Lesson title="My first lesson" lessonId="lesson-1">
            <Scenario>
              <p>Replace this content with your training material.</p>
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

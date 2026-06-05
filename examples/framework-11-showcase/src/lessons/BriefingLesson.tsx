import { Quiz, Reflection, Scenario } from "@lessonkit/react";

export function BriefingLesson() {
  return (
    <>
      <Scenario blockId="briefing-scenario">
        <p>
          You are starting a SOC shift during elevated phishing activity. This lesson covers the{" "}
          <strong>LessonKit 1.0 foundation</strong>—structure blocks that every course builds on before
          the 1.1 assessment contract.
        </p>
      </Scenario>

      <div className="showcase-callout">
        <strong>Need 1.2 blocks too?</strong> Run the sibling showcase:{" "}
        <code>npm -w lessonkit-example-framework-12-showcase run dev</code>
      </div>

      <ul className="showcase-objectives">
        <li>Structure — Course, Lesson, Scenario, ProgressTracker</li>
        <li>MCQ — Quiz (this lesson) and KnowledgeCheck (next lesson)</li>
        <li>Reflection — open response with telemetry</li>
      </ul>

      <Reflection blockId="shift-reflection" prompt="What is one signal you will watch for this shift?">
        <p>Jot a short note—Reflection emits interaction telemetry without LMS scoring.</p>
      </Reflection>

      <Quiz
        checkId="briefing-quiz"
        question="What is the first step when you suspect credential theft?"
        choices={["Reset your password silently", "Report to the SOC hotline"]}
        answer="Report to the SOC hotline"
      />
    </>
  );
}

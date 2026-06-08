import { useMemo } from "react";
import {
  AssessmentSequence,
  Course,
  DragAndDrop,
  DragTheWords,
  FillInTheBlanks,
  Lesson,
  MarkTheWords,
  TrueFalse,
} from "@lessonkit/react";
import { ExampleThemeShell } from "../../_shared/ExampleThemeShell";

const COURSE_ID = "assessments-p0-demo";

export default function App() {
  const config = useMemo(
    () => ({ tracking: { enabled: false }, xapi: { enabled: false } }),
    [],
  );

  return (
    <ExampleThemeShell>
      <Course title="Assessment blocks (1.1.0)" courseId={COURSE_ID} config={config}>
        <Lesson title="P0 interactions" lessonId="p0-lesson">
          <AssessmentSequence blockId="p0-assessment-sequence">
            <TrueFalse
              checkId="phishing-tf"
              question="Phishing emails are always easy to spot."
              answer={false}
            />
            <FillInTheBlanks
              checkId="report-fib"
              template="Report suspicious mail to *security*."
            />
            <MarkTheWords
              checkId="policy-mtw"
              text="Never share your password with colleagues"
              correctWords={["password"]}
            />
            <DragTheWords
              checkId="verb-dtw"
              template="Click *Report* on suspicious messages"
              words={["Report", "Delete", "Forward"]}
            />
            <DragAndDrop
              checkId="channel-dad"
              items={[
                { id: "email", label: "Unknown email link" },
                { id: "portal", label: "IT service portal" },
              ]}
              targets={[
                { id: "risk", label: "High risk action", accepts: "email" },
                { id: "safe", label: "Approved channel", accepts: "portal" },
              ]}
            />
          </AssessmentSequence>
        </Lesson>
      </Course>
    </ExampleThemeShell>
  );
}

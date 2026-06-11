import { useMemo } from "react";
import {
  AssessmentSequence,
  Course,
  DragAndDrop,
  DragTheWords,
  FillInTheBlanks,
  GuessTheAnswer,
  Lesson,
  MarkTheWords,
  MultimediaChoice,
  Quiz,
  SingleChoiceSet,
  SortParagraphs,
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
      <Course title="Assessment blocks (1.7.0)" courseId={COURSE_ID} config={config}>
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
            <SortParagraphs
              checkId="incident-sort"
              paragraphs={[
                "Identify the suspicious message",
                "Report it to security",
                "Do not click unknown links",
              ]}
              correctOrder={[0, 1, 2]}
            />
            <GuessTheAnswer
              checkId="policy-guess"
              prompt="What acronym covers EU data protection rules?"
              answer="GDPR"
            />
            <MultimediaChoice
              checkId="channel-mm"
              question="Which icon represents the approved IT channel?"
              choices={[
                {
                  label: "Service portal",
                  mediaUrl:
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%232563eb' width='48' height='48'/%3E%3C/svg%3E",
                  mediaKind: "image",
                  altText: "IT service portal",
                },
                {
                  label: "Unknown email",
                  mediaUrl:
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23dc2626' width='48' height='48'/%3E%3C/svg%3E",
                  mediaKind: "image",
                  altText: "Suspicious email link",
                },
              ]}
              answer="Service portal"
            />
          </AssessmentSequence>
          <SingleChoiceSet blockId="p0-single-choice-set" title="Quick checks" showSetScore>
            <Quiz
              checkId="scs-report"
              question="Should you forward suspicious mail?"
              choices={["Yes", "No"]}
              answer="No"
            />
            <Quiz
              checkId="scs-portal"
              question="Use the IT portal for access requests?"
              choices={["Yes", "No"]}
              answer="Yes"
            />
          </SingleChoiceSet>
          <section aria-label="Quiz variants (1.7.0)">
            <h3>Quiz variants</h3>
            <Quiz
              checkId="hazards-multi"
              question="Select all social-engineering risks"
              choices={["Phishing email", "IT portal", "Tailgating"]}
              answer="Phishing email"
              answers={["Phishing email", "Tailgating"]}
            />
            <Quiz
              checkId="channel-shuffled"
              question="Which is the approved IT channel?"
              choices={["Unknown email", "Service portal", "Public USB"]}
              answer="Service portal"
              shuffleChoices
            />
            <Quiz
              checkId="action-feedback"
              question="Which action is safest?"
              choices={["Click the link", "Use the IT portal"]}
              answer="Use the IT portal"
              choiceFeedback={{
                "Click the link": "Unknown links may be phishing.",
                "Use the IT portal": "Approved channel for IT requests.",
              }}
            />
          </section>
        </Lesson>
      </Course>
    </ExampleThemeShell>
  );
}

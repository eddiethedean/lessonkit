import { KnowledgeCheck, MarkTheWords, TrueFalse } from "@lessonkit/react";

export function SignalTriageLesson() {
  return (
    <>
      <p className="showcase-lead">
        LessonKit <strong>1.1.0</strong> introduced the shared assessment contract (
        <code>AssessmentHandle</code>, <code>assessment_*</code> telemetry) and the first P0 blocks below.
      </p>

      <section className="showcase-section">
        <h3 className="showcase-section-title">TrueFalse</h3>
        <TrueFalse
          checkId="signal-tf"
          question="You may ignore low-severity alerts overnight without logging them."
          answer={false}
        />
      </section>

      <section className="showcase-section">
        <h3 className="showcase-section-title">MarkTheWords</h3>
        <MarkTheWords
          checkId="token-mtw"
          text="Never paste production credentials into chat"
          correctWords={["credentials"]}
        />
      </section>

      <section className="showcase-section">
        <h3 className="showcase-section-title">KnowledgeCheck (MCQ)</h3>
        <KnowledgeCheck
          checkId="verify-kc"
          question="Which channel is approved for PII discussions?"
          choices={["Public Slack", "Encrypted ticket queue"]}
          answer="Encrypted ticket queue"
        />
      </section>
    </>
  );
}

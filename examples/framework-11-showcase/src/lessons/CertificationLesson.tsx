import {
  AssessmentSequence,
  DragAndDrop,
  DragTheWords,
  FillInTheBlanks,
  MarkTheWords,
  TrueFalse,
} from "@lessonkit/react";

export function CertificationLesson() {
  return (
    <>
      <p className="showcase-lead">
        <strong>AssessmentSequence</strong> (1.1) presents a question set—one child assessment at a time,
        with sequential navigation and aggregated progress.
      </p>

      <AssessmentSequence blockId="cert-sequence">
        <TrueFalse
          checkId="cert-tf"
          question="Shared admin accounts speed up incident response."
          answer={false}
        />
        <FillInTheBlanks
          checkId="cert-fib"
          template="Revoke sessions on the *compromised* host."
        />
        <MarkTheWords
          checkId="cert-mtw"
          text="Rotate production credentials after containment"
          correctWords={["credentials"]}
        />
        <DragTheWords
          checkId="cert-dtw"
          template="First action: *Isolate* the endpoint."
          words={["Isolate", "Delete", "Share"]}
        />
        <DragAndDrop
          checkId="cert-dad"
          items={[
            { id: "binary", label: "Suspicious binary" },
            { id: "screenshot", label: "Redacted screenshot" },
          ]}
          targets={[
            { id: "vault", label: "Sandbox vault", accepts: "binary" },
            { id: "case", label: "Case record", accepts: "screenshot" },
          ]}
        />
      </AssessmentSequence>
    </>
  );
}

import { DragAndDrop, DragTheWords, FillInTheBlanks } from "@lessonkit/react";

export function ContainmentDrillsLesson() {
  return (
    <>
      <p className="showcase-lead">
        Interactive P0 blocks from 1.1—each implements <code>AssessmentHandle</code> for xAPI and LMS
        bridge forwarding.
      </p>

      <section className="showcase-section">
        <h3 className="showcase-section-title">FillInTheBlanks</h3>
        <FillInTheBlanks
          checkId="escalate-fib"
          template="Page the on-call lead via the *hotline*."
        />
      </section>

      <section className="showcase-section">
        <h3 className="showcase-section-title">DragTheWords</h3>
        <DragTheWords
          checkId="runbook-dtw"
          template="Step 1: *Isolate* the affected host."
          words={["Isolate", "Ignore", "Publish"]}
        />
      </section>

      <section className="showcase-section">
        <h3 className="showcase-section-title">DragAndDrop</h3>
        <DragAndDrop
          checkId="tier-dad"
          items={[
            { id: "sample", label: "Malware sample" },
            { id: "log", label: "Sanitized log excerpt" },
          ]}
          targets={[
            { id: "vault", label: "Sandbox vault", accepts: "sample" },
            { id: "ticket", label: "Incident ticket", accepts: "log" },
          ]}
        />
      </section>
    </>
  );
}

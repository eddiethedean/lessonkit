import {
  AssessmentSequence,
  DragAndDrop,
  DragTheWords,
  FillInTheBlanks,
  FindHotspot,
  FindMultipleHotspots,
  Heading,
  MarkTheWords,
  Text,
  TrueFalse,
} from "@lessonkit/react";
import { WORKSPACE_MAP } from "../constants";

const HOTSPOT_TARGETS = [
  { id: "widget-pii", label: "PII dashboard", x: 22, y: 38 },
  { id: "widget-payroll", label: "Payroll summary", x: 78, y: 38 },
  { id: "ack-alert", label: "Ack alert", x: 22, y: 78 },
  { id: "widget-public", label: "Public KPIs", x: 78, y: 78 },
] as const;

export function CertificationLesson() {
  return (
    <>
      <Heading blockId="cert-heading" level={2}>
        Certification lab
      </Heading>
      <Text>
        Work through the question set below. <strong>AssessmentSequence</strong> implements{" "}
        <code>CompoundHandle</code>—parent scores aggregate child assessments when you wire a ref in your own apps.
      </Text>

      <AssessmentSequence blockId="cert-sequence">
        <TrueFalse
          checkId="atlas-sso-tf"
          question="You should share Atlas dashboard links in public channels."
          answer={false}
        />
        <FillInTheBlanks
          checkId="report-channel-fib"
          template="Report suspicious exports to the *security* desk."
        />
        <MarkTheWords
          checkId="policy-mtw"
          text="Never paste production credentials into chat"
          correctWords={["credentials"]}
        />
        <DragTheWords
          checkId="sync-dtw"
          template="Before publish, *Validate* the model output."
          words={["Validate", "Delete", "Ignore"]}
        />
        <DragAndDrop
          checkId="export-dad"
          items={[
            { id: "csv", label: "Raw CSV export" },
            { id: "slide", label: "Public KPI slide" },
          ]}
          targets={[
            { id: "vault", label: "Approved vault", accepts: "csv" },
            { id: "deck", label: "All-hands deck", accepts: "slide" },
          ]}
        />
        <FindHotspot
          checkId="alert-hs"
          src={WORKSPACE_MAP.src}
          alt={WORKSPACE_MAP.alt}
          targets={[...HOTSPOT_TARGETS]}
          correctTargetId="ack-alert"
        />
        <FindMultipleHotspots
          checkId="dashboards-hs"
          src={WORKSPACE_MAP.src}
          alt={WORKSPACE_MAP.alt}
          targets={[...HOTSPOT_TARGETS]}
          correctTargetIds={["widget-pii", "widget-payroll"]}
        />
      </AssessmentSequence>
    </>
  );
}

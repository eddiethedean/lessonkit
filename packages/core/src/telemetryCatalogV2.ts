import type { TelemetryEventName } from "./telemetryTypes";

export const telemetryCatalogV2Version = 2 as const;

export type TelemetryCatalogV2Entry = {
  name: Extract<TelemetryEventName, "assessment_answered" | "assessment_completed">;
  description: string;
  requiredFields: string[];
  dataFields: string[];
  xapiVerb: string;
  urnPattern: string;
};

export const TELEMETRY_EVENT_CATALOG_V2: TelemetryCatalogV2Entry[] = [
  {
    name: "assessment_answered",
    description: "Learner submitted an assessment interaction answer",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["checkId", "interactionType", "question", "response", "correct"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/answered",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:check:{checkId}",
  },
  {
    name: "assessment_completed",
    description: "Assessment interaction completed (passing criteria met)",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["checkId", "interactionType", "score", "maxScore", "passingScore"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/completed",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:check:{checkId}",
  },
];

export function buildTelemetryCatalogV2(): TelemetryCatalogV2Entry[] {
  return TELEMETRY_EVENT_CATALOG_V2.map((entry) => ({ ...entry }));
}

import type { TelemetryEventName } from "./telemetryTypes";

export const telemetryCatalogVersion = 1 as const;

export type TelemetryCatalogEntry = {
  name: TelemetryEventName;
  description: string;
  requiredFields: string[];
  dataFields: string[];
  xapiVerb: string;
  urnPattern: string;
};

export const TELEMETRY_EVENT_CATALOG: TelemetryCatalogEntry[] = [
  {
    name: "course_started",
    description: "Learner session began for a course",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: [],
    xapiVerb: "http://adlnet.gov/expapi/verbs/initialized",
    urnPattern: "urn:lessonkit:course:{courseId}",
  },
  {
    name: "course_completed",
    description: "Course completion criteria met",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: [],
    xapiVerb: "http://adlnet.gov/expapi/verbs/completed",
    urnPattern: "urn:lessonkit:course:{courseId}",
  },
  {
    name: "lesson_started",
    description: "Lesson became active",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["lessonId"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/initialized",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}",
  },
  {
    name: "lesson_completed",
    description: "Lesson marked complete",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["lessonId", "durationMs"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/completed",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}",
  },
  {
    name: "lesson_time_on_task",
    description: "Time on task for a lesson (companion to lesson_completed)",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["lessonId", "durationMs"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/completed",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}",
  },
  {
    name: "quiz_answered",
    description: "Learner submitted a quiz/check answer",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["checkId", "question", "choice", "correct"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/answered",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:check:{checkId}",
  },
  {
    name: "quiz_completed",
    description: "Quiz/check completed (e.g. first correct answer)",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["checkId", "score", "maxScore"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/completed",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:check:{checkId}",
  },
  {
    name: "interaction",
    description: "Custom interaction (branching, UI actions, blocks)",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["kind", "blockId", "payload"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
];

export function buildTelemetryCatalog(): TelemetryCatalogEntry[] {
  return TELEMETRY_EVENT_CATALOG.map((entry) => ({ ...entry }));
}

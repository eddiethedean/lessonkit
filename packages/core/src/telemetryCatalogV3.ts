import type { TelemetryEventName } from "./telemetryTypes";

export const telemetryCatalogV3Version = 3 as const;

export type TelemetryCatalogV3EventName = Extract<
  TelemetryEventName,
  | "book_page_viewed"
  | "slide_viewed"
  | "compound_page_viewed"
  | "hotspot_opened"
  | "accordion_section_toggled"
  | "flashcard_flipped"
  | "image_slider_changed"
  | "video_cue_reached"
  | "video_segment_completed"
  | "memory_card_flipped"
  | "information_wall_search"
  | "parallax_slide_viewed"
  | "questionnaire_submitted"
>;

export type TelemetryCatalogV3Entry = {
  name: TelemetryCatalogV3EventName;
  description: string;
  requiredFields: string[];
  dataFields: string[];
  xapiVerb: string;
  urnPattern: string;
};

export const TELEMETRY_EVENT_CATALOG_V3: TelemetryCatalogV3Entry[] = [
  {
    name: "book_page_viewed",
    description: "Learner viewed a page/chapter in an Interactive Book",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["blockId", "pageIndex", "pageTitle"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "slide_viewed",
    description: "Learner viewed a slide in a SlideDeck (Course Presentation)",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["blockId", "slideIndex", "slideTitle"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "compound_page_viewed",
    description: "Learner activated a page inside a compound container",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["blockId", "pageIndex", "parentType"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "hotspot_opened",
    description: "Learner opened an image hotspot popover",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId", "hotspotId"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "accordion_section_toggled",
    description: "Learner expanded or collapsed an accordion section",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId", "sectionId", "expanded"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "flashcard_flipped",
    description: "Learner flipped a flashcard",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId", "cardIndex", "face"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "image_slider_changed",
    description: "Learner changed the active slide in an image slider",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId", "slideIndex"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "video_cue_reached",
    description: "Learner reached a timed cue in an Interactive Video",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["blockId", "cueIndex", "atSeconds", "cueLabel"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "video_segment_completed",
    description: "Learner completed a timed segment in an Interactive Video",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["blockId", "segmentIndex", "atSeconds", "segmentLabel"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/completed",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "memory_card_flipped",
    description: "Learner flipped a memory game card",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId", "cardIndex", "face"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "information_wall_search",
    description: "Learner searched an information wall",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId", "query", "resultCount"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "parallax_slide_viewed",
    description: "Learner viewed a slide in a parallax slideshow",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId", "slideIndex"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "questionnaire_submitted",
    description: "Learner submitted an unscored questionnaire",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["blockId", "fieldCount"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/completed",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
];

export function buildTelemetryCatalogV3(): TelemetryCatalogV3Entry[] {
  return TELEMETRY_EVENT_CATALOG_V3.map((entry) => ({ ...entry }));
}

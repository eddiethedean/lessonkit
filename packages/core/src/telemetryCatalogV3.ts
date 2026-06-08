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
  | "branch_node_viewed"
  | "branch_selected"
  | "image_juxtaposition_changed"
  | "timeline_event_viewed"
  | "image_sequence_changed"
  | "audio_recording_started"
  | "audio_recording_completed"
  | "qr_content_revealed"
  | "advent_door_opened"
  | "map_stage_viewed"
  | "map_exit_selected"
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
  {
    name: "branch_node_viewed",
    description: "Learner viewed a node in a BranchingScenario",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["blockId", "nodeId", "nodeIndex", "nodeTitle"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern:
      "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}:node:{nodeId}",
  },
  {
    name: "branch_selected",
    description: "Learner selected a branch choice in a BranchingScenario",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["blockId", "fromNodeId", "toNodeId", "label", "scoreWeight"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/answered",
    urnPattern:
      "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}:node:{toNodeId}",
  },
  {
    name: "image_juxtaposition_changed",
    description: "Learner adjusted the before/after divider",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId", "position"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/interacted",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "timeline_event_viewed",
    description: "Learner focused a timeline event",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId", "eventId"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "image_sequence_changed",
    description: "Learner changed the image sequence frame",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId", "frameIndex"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/interacted",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "audio_recording_started",
    description: "Learner started an audio recording",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/interacted",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "audio_recording_completed",
    description: "Learner completed an audio recording",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/completed",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "qr_content_revealed",
    description: "Learner revealed QR hidden content",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "advent_door_opened",
    description: "Learner opened an advent calendar door",
    requiredFields: ["courseId", "sessionId", "timestamp"],
    dataFields: ["blockId", "doorId", "day"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/interacted",
    urnPattern: "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}",
  },
  {
    name: "map_stage_viewed",
    description: "Learner viewed a stage in a GameMap",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["blockId", "stageId", "stageIndex", "stageLabel"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/experienced",
    urnPattern:
      "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}:stage:{stageId}",
  },
  {
    name: "map_exit_selected",
    description: "Learner selected a map exit in a GameMap",
    requiredFields: ["courseId", "lessonId", "sessionId", "timestamp"],
    dataFields: ["blockId", "fromStageId", "toStageId", "label", "scoreWeight"],
    xapiVerb: "http://adlnet.gov/expapi/verbs/answered",
    urnPattern:
      "urn:lessonkit:course:{courseId}:lesson:{lessonId}:block:{blockId}:stage:{toStageId}",
  },
];

export function buildTelemetryCatalogV3(): TelemetryCatalogV3Entry[] {
  return TELEMETRY_EVENT_CATALOG_V3.map((entry) => ({ ...entry }));
}

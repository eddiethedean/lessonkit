import { describe, expect, it } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import { createXAPIClient, telemetryEventToXAPIStatement } from "../src";
import { buildXapiScoreResult } from "../src/telemetryMap";

const base = {
  courseId: "cyber-basics",
  lessonId: "phishing-101",
  sessionId: "sess-1",
  timestamp: "2026-05-28T12:00:00.000Z",
} as const;

import { formatDurationMs } from "../src/duration";

describe("formatDurationMs", () => {
  it("returns undefined for non-finite durations", () => {
    expect(formatDurationMs(Number.NaN)).toBeUndefined();
    expect(formatDurationMs(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(formatDurationMs(-1)).toBeUndefined();
  });
});

describe("buildXapiScoreResult", () => {
  it("omits scaled when raw exceeds max or inputs are non-finite", () => {
    expect(buildXapiScoreResult({ score: 15, maxScore: 10 })).toEqual({
      raw: 15,
      max: 10,
      min: 0,
    });
    expect(buildXapiScoreResult({ score: Number.NaN, maxScore: 10 })).toBeUndefined();
    expect(buildXapiScoreResult({ score: 5, maxScore: 0 })).toBeUndefined();
    expect(buildXapiScoreResult({ score: -1, maxScore: 10 })).toBeUndefined();
  });

  it("includes scaled for valid in-range scores", () => {
    expect(buildXapiScoreResult({ score: 7, maxScore: 10 })).toEqual({
      raw: 7,
      max: 10,
      min: 0,
      scaled: 0.7,
    });
  });
});

describe("telemetryEventToXAPIStatement", () => {
  it("omits invalid lesson duration from completion statements", () => {
    const statement = telemetryEventToXAPIStatement({
      name: "lesson_completed",
      courseId: base.courseId,
      lessonId: base.lessonId,
      sessionId: base.sessionId,
      timestamp: base.timestamp,
      data: { durationMs: Number.NaN, lessonId: base.lessonId },
    });
    expect(statement?.result?.duration).toBeUndefined();
  });

  it("maps course and lesson lifecycle events", () => {
    expect(
      telemetryEventToXAPIStatement({
        name: "course_started",
        courseId: base.courseId,
        timestamp: base.timestamp,
      })?.object.id,
    ).toBe("urn:lessonkit:course:cyber-basics");

    expect(
      telemetryEventToXAPIStatement({
        name: "course_completed",
        courseId: base.courseId,
        timestamp: base.timestamp,
      })?.verb,
    ).toBe("http://adlnet.gov/expapi/verbs/completed");

    expect(
      telemetryEventToXAPIStatement({
        name: "lesson_started",
        ...base,
        data: { lessonId: base.lessonId },
      })?.object.id,
    ).toBe("urn:lessonkit:course:cyber-basics:lesson:phishing-101");
  });

  it("maps quiz events to check URNs", () => {
    const answered: TelemetryEvent = {
      name: "quiz_answered",
      ...base,
      data: {
        checkId: "verify-sender",
        question: "Q",
        choice: "A",
        correct: true,
      },
    };
    expect(telemetryEventToXAPIStatement(answered)?.verb).toBe(
      "http://adlnet.gov/expapi/verbs/answered",
    );
    expect(telemetryEventToXAPIStatement(answered)?.object.id).toBe(
      "urn:lessonkit:course:cyber-basics:lesson:phishing-101:check:verify-sender",
    );
    expect(telemetryEventToXAPIStatement(answered)?.result?.success).toBe(true);

    const unanswered = {
      name: "quiz_answered",
      courseId: base.courseId,
      lessonId: base.lessonId,
      sessionId: base.sessionId,
      timestamp: base.timestamp,
      data: { checkId: "verify-sender", question: "Q", choice: "A" },
    } as TelemetryEvent;
    expect(telemetryEventToXAPIStatement(unanswered)?.result).toBeUndefined();
  });

  it("returns null for lesson_time_on_task", () => {
    expect(
      telemetryEventToXAPIStatement({
        name: "lesson_time_on_task",
        ...base,
        data: { lessonId: base.lessonId, durationMs: 100 },
      }),
    ).toBeNull();
  });

  it("returns null for lesson_completed without lessonId", () => {
    expect(
      telemetryEventToXAPIStatement({
        name: "lesson_completed",
        courseId: base.courseId,
        sessionId: base.sessionId,
        timestamp: base.timestamp,
      } as TelemetryEvent),
    ).toBeNull();
  });

  it("maps lesson_completed with duration and score", () => {
    const stmt = telemetryEventToXAPIStatement({
      name: "lesson_completed",
      ...base,
      data: { lessonId: base.lessonId, durationMs: 1500, score: 1, maxScore: 2, success: true },
    });
    expect(stmt?.result?.duration).toBe("PT1.5S");
    expect(stmt?.result?.success).toBe(true);
    expect(stmt?.result?.score).toMatchObject({ raw: 1, max: 2 });
  });

  it("maps lesson_completed partial result fields", () => {
    const scoreOnly = telemetryEventToXAPIStatement({
      name: "lesson_completed",
      ...base,
      data: { lessonId: base.lessonId, score: 3 },
    });
    expect(scoreOnly?.result?.score).toMatchObject({ raw: 3, min: 0 });
    expect(scoreOnly?.result?.score).not.toHaveProperty("scaled");

    const maxOnly = telemetryEventToXAPIStatement({
      name: "lesson_completed",
      ...base,
      data: { lessonId: base.lessonId, maxScore: 10 },
    });
    expect(maxOnly?.result?.score).toMatchObject({ max: 10, min: 0 });
    expect(maxOnly?.result?.score).not.toHaveProperty("scaled");

    const zeroMax = telemetryEventToXAPIStatement({
      name: "lesson_completed",
      ...base,
      data: { lessonId: base.lessonId, score: 1, maxScore: 0 },
    });
    expect(zeroMax?.result?.score).toBeUndefined();

    const bare = telemetryEventToXAPIStatement({
      name: "lesson_completed",
      ...base,
      data: { lessonId: base.lessonId },
    });
    expect(bare?.result).toBeUndefined();
  });

  it("maps quiz_completed with score", () => {
    const stmt = telemetryEventToXAPIStatement({
      name: "quiz_completed",
      ...base,
      data: { checkId: "c1", score: 1, maxScore: 1 },
    });
    expect(stmt?.object.id).toContain(":check:c1");
    expect(stmt?.result?.score).toMatchObject({ raw: 1, max: 1, scaled: 1 });

    const scoreOnly = telemetryEventToXAPIStatement({
      name: "quiz_completed",
      ...base,
      data: { checkId: "c1", score: 2 },
    });
    expect(scoreOnly?.result?.score).toMatchObject({ raw: 2, min: 0 });

    const maxOnly = telemetryEventToXAPIStatement({
      name: "quiz_completed",
      ...base,
      data: { checkId: "c1", maxScore: 4 },
    });
    expect(maxOnly?.result?.score).toMatchObject({ max: 4, min: 0 });

    const bare = telemetryEventToXAPIStatement({
      name: "quiz_completed",
      ...base,
      data: { checkId: "c1" },
    });
    expect(bare?.result).toBeUndefined();
  });

  it("maps interaction with blockId and returns null without blockId", () => {
    expect(
      telemetryEventToXAPIStatement({
        name: "interaction",
        courseId: base.courseId,
        timestamp: base.timestamp,
        lessonId: base.lessonId,
        data: { kind: "click" },
      }),
    ).toBeNull();

    expect(
      telemetryEventToXAPIStatement({
        name: "interaction",
        courseId: base.courseId,
        timestamp: base.timestamp,
        data: { kind: "click", blockId: "intro" },
      }),
    ).toBeNull();

    expect(
      telemetryEventToXAPIStatement({
        name: "interaction",
        ...base,
        data: { kind: "click", blockId: "intro" },
      })?.object.id,
    ).toBe("urn:lessonkit:course:cyber-basics:lesson:phishing-101:block:intro");
  });

  it("maps embed_viewed and chart_viewed interactions with xAPI extensions", () => {
    const embed = telemetryEventToXAPIStatement({
      name: "interaction",
      ...base,
      data: { kind: "embed_viewed", blockId: "embed-1", src: "https://example.com/video" },
    });
    const embedExt = embed?.context?.extensions as Record<string, unknown> | undefined;
    expect(embed?.verb).toBe("http://adlnet.gov/expapi/verbs/experienced");
    expect(embedExt?.["https://lessonkit.dev/xapi/interactionKind"]).toBe("embed_viewed");
    expect(embedExt?.["https://lessonkit.dev/xapi/embedSrc"]).toBe("https://example.com/video");

    const embedWithToken = telemetryEventToXAPIStatement({
      name: "interaction",
      ...base,
      data: {
        kind: "embed_viewed",
        blockId: "embed-1",
        src: "https://user:secret@example.com/doc?token=secret#frag",
      },
    });
    const tokenExt = embedWithToken?.context?.extensions as Record<string, unknown> | undefined;
    expect(tokenExt?.["https://lessonkit.dev/xapi/embedSrc"]).toBe("https://example.com/doc");

    const chart = telemetryEventToXAPIStatement({
      name: "interaction",
      ...base,
      data: { kind: "chart_viewed", blockId: "chart-1", chartType: "bar" },
    });
    const chartExt = chart?.context?.extensions as Record<string, unknown> | undefined;
    expect(chartExt?.["https://lessonkit.dev/xapi/interactionKind"]).toBe("chart_viewed");
    expect(chartExt?.["https://lessonkit.dev/xapi/chartType"]).toBe("bar");

    const embedNoSrc = telemetryEventToXAPIStatement({
      name: "interaction",
      ...base,
      data: { kind: "embed_viewed", blockId: "embed-2" },
    });
    const embedNoSrcExt = embedNoSrc?.context?.extensions as Record<string, unknown> | undefined;
    expect(embedNoSrcExt?.["https://lessonkit.dev/xapi/embedSrc"]).toBeUndefined();
  });

  it("maps assessment_answered and assessment_completed", () => {
    const answered = telemetryEventToXAPIStatement({
      name: "assessment_answered",
      ...base,
      data: {
        checkId: "tf-1",
        interactionType: "trueFalse",
        correct: false,
      },
    });
    expect(answered?.verb).toBe("http://adlnet.gov/expapi/verbs/answered");
    expect(answered?.result?.success).toBe(false);
    expect(answered?.object.id).toBe(
      "urn:lessonkit:course:cyber-basics:lesson:phishing-101:check:tf-1",
    );

    const answeredBare = telemetryEventToXAPIStatement({
      name: "assessment_answered",
      ...base,
      data: { checkId: "tf-1", interactionType: "trueFalse" },
    });
    expect(answeredBare?.result).toBeUndefined();

    const completed = telemetryEventToXAPIStatement({
      name: "assessment_completed",
      ...base,
      data: { checkId: "fib-1", interactionType: "fillInBlanks", score: 2, maxScore: 2 },
    });
    expect(completed?.verb).toBe("http://adlnet.gov/expapi/verbs/completed");
    expect(completed?.result?.score).toMatchObject({ raw: 2, max: 2, scaled: 1 });
    expect(completed?.object.id).toBe(
      "urn:lessonkit:course:cyber-basics:lesson:phishing-101:check:fib-1",
    );

    const completedBare = telemetryEventToXAPIStatement({
      name: "assessment_completed",
      ...base,
      data: { checkId: "fib-1", interactionType: "fillInBlanks" },
    });
    expect(completedBare?.result).toBeUndefined();

    const scoreOnly = telemetryEventToXAPIStatement({
      name: "assessment_completed",
      ...base,
      data: { checkId: "fib-1", interactionType: "fillInBlanks", score: 1 },
    });
    expect(scoreOnly?.result?.score).toMatchObject({ raw: 1, min: 0 });

    const maxOnly = telemetryEventToXAPIStatement({
      name: "assessment_completed",
      ...base,
      data: { checkId: "fib-1", interactionType: "fillInBlanks", maxScore: 2 },
    });
    expect(maxOnly?.result?.score).toMatchObject({ max: 2, min: 0 });
  });

  it("maps v3 content and compound events to experienced block URNs", () => {
    const bookPage = telemetryEventToXAPIStatement({
      name: "book_page_viewed",
      ...base,
      data: { blockId: "safety-book", pageIndex: 0, pageTitle: "Intro" },
    });
    expect(bookPage?.verb).toBe("http://adlnet.gov/expapi/verbs/experienced");
    expect(bookPage?.object.id).toBe(
      "urn:lessonkit:course:cyber-basics:lesson:phishing-101:block:safety-book",
    );

    const slideViewed = telemetryEventToXAPIStatement({
      name: "slide_viewed",
      ...base,
      data: { blockId: "training-deck", slideIndex: 0, slideTitle: "Intro" },
    });
    expect(slideViewed?.verb).toBe("http://adlnet.gov/expapi/verbs/experienced");
    expect(slideViewed?.object.id).toBe(
      "urn:lessonkit:course:cyber-basics:lesson:phishing-101:block:training-deck",
    );

    const compoundPage = telemetryEventToXAPIStatement({
      name: "compound_page_viewed",
      ...base,
      data: { blockId: "page-intro", pageIndex: 0, parentType: "InteractiveBook" },
    });
    expect(compoundPage?.object.id).toContain(":block:page-intro");

    const hotspot = telemetryEventToXAPIStatement({
      name: "hotspot_opened",
      ...base,
      data: { blockId: "map-1", hotspotId: "h1" },
    });
    expect(hotspot?.verb).toBe("http://adlnet.gov/expapi/verbs/experienced");

    const accordion = telemetryEventToXAPIStatement({
      name: "accordion_section_toggled",
      ...base,
      data: { blockId: "acc-1", sectionId: "s1", expanded: true },
    });
    expect(accordion?.verb).toBe("http://adlnet.gov/expapi/verbs/experienced");

    const flashcard: TelemetryEvent = {
      name: "flashcard_flipped",
      ...base,
      data: { blockId: "fc-1", cardIndex: 0, face: "back" },
    };
    expect(telemetryEventToXAPIStatement(flashcard)?.verb).toBe(
      "http://adlnet.gov/expapi/verbs/experienced",
    );

    const slider: TelemetryEvent = {
      name: "image_slider_changed",
      ...base,
      data: { blockId: "slider-1", slideIndex: 1 },
    };
    expect(telemetryEventToXAPIStatement(slider)?.object.id).toContain(":block:slider-1");

    expect(
      telemetryEventToXAPIStatement({
        name: "book_page_viewed",
        courseId: base.courseId,
        timestamp: base.timestamp,
        data: { blockId: "book-1", pageIndex: 0 },
      } as TelemetryEvent),
    ).toBeNull();
  });

  it("maps 1.4 video and content interaction events", () => {
    const cue = telemetryEventToXAPIStatement({
      name: "video_cue_reached",
      ...base,
      data: { blockId: "iv-1", cueIndex: 0, atSeconds: 5, cueLabel: "Check" },
    });
    expect(cue?.verb).toBe("http://adlnet.gov/expapi/verbs/experienced");
    expect(cue?.object.id).toContain(":block:iv-1");

    const segment = telemetryEventToXAPIStatement({
      name: "video_segment_completed",
      ...base,
      data: { blockId: "iv-1", segmentIndex: 0, atSeconds: 5 },
    });
    expect(segment?.verb).toBe("http://adlnet.gov/expapi/verbs/completed");

    expect(
      telemetryEventToXAPIStatement({
        name: "memory_card_flipped",
        ...base,
        data: { blockId: "mem-1", cardIndex: 2, face: "back" },
      })?.verb,
    ).toBe("http://adlnet.gov/expapi/verbs/experienced");

    expect(
      telemetryEventToXAPIStatement({
        name: "information_wall_search",
        ...base,
        data: { blockId: "wall-1", query: "ppe", resultCount: 1 },
      })?.object.id,
    ).toContain(":block:wall-1");

    expect(
      telemetryEventToXAPIStatement({
        name: "parallax_slide_viewed",
        ...base,
        data: { blockId: "para-1", slideIndex: 1 },
      })?.object.id,
    ).toContain(":block:para-1");

    expect(
      telemetryEventToXAPIStatement({
        name: "questionnaire_submitted",
        ...base,
        data: { blockId: "survey-1", fieldCount: 3 },
      })?.verb,
    ).toBe("http://adlnet.gov/expapi/verbs/completed");

    const branchViewed = telemetryEventToXAPIStatement({
      name: "branch_node_viewed",
      ...base,
      data: { blockId: "branch-1", nodeId: "offer", nodeIndex: 0, nodeTitle: "Offer" },
    });
    expect(branchViewed?.verb).toBe("http://adlnet.gov/expapi/verbs/experienced");
    expect(branchViewed?.object.id).toBe(
      "urn:lessonkit:course:cyber-basics:lesson:phishing-101:block:branch-1:node:offer",
    );

    const branchSelected = telemetryEventToXAPIStatement({
      name: "branch_selected",
      ...base,
      data: {
        blockId: "branch-1",
        fromNodeId: "offer",
        toNodeId: "credit",
        label: "Credit",
        scoreWeight: 1,
      },
    });
    expect(branchSelected?.verb).toBe("http://adlnet.gov/expapi/verbs/experienced");
    expect(branchSelected?.object.id).toContain(":node:credit");
    expect(branchSelected?.result?.score).toBeUndefined();
  });

  it("maps branch_selected without scoreWeight as experienced", () => {
    const branchSelected = telemetryEventToXAPIStatement({
      name: "branch_selected",
      courseId: "c1",
      lessonId: "l1",
      timestamp: "2026-01-01T00:00:00.000Z",
      sessionId: "s1",
      data: {
        blockId: "branch-1",
        fromNodeId: "offer",
        toNodeId: "supervisor",
        label: "Supervisor",
      },
    });
    expect(branchSelected?.verb).toBe("http://adlnet.gov/expapi/verbs/experienced");
  });

  it("maps 1.6.x content and GameMap telemetry events", () => {
    const blockEvents = [
      "image_juxtaposition_changed",
      "timeline_event_viewed",
      "image_sequence_changed",
      "audio_recording_started",
      "qr_content_revealed",
      "advent_door_opened",
    ] as const;

    for (const name of blockEvents) {
      const stmt = telemetryEventToXAPIStatement({
        name,
        ...base,
        data: { blockId: "block-16" },
      } as TelemetryEvent);
      expect(stmt?.verb).toBe("http://adlnet.gov/expapi/verbs/experienced");
      expect(stmt?.object.id).toContain(":block:block-16");
    }

    const audioCompleted = telemetryEventToXAPIStatement({
      name: "audio_recording_completed",
      ...base,
      data: { blockId: "rec-1", durationMs: 1200 },
    } as TelemetryEvent);
    expect(audioCompleted?.verb).toBe("http://adlnet.gov/expapi/verbs/completed");
    expect(
      telemetryEventToXAPIStatement({
        name: "audio_recording_completed",
        courseId: base.courseId,
        timestamp: base.timestamp,
        data: { durationMs: 1200 },
      } as unknown as TelemetryEvent),
    ).toBeNull();

    const mapStage = telemetryEventToXAPIStatement({
      name: "map_stage_viewed",
      ...base,
      data: { blockId: "map-1", stageId: "lobby" },
    } as TelemetryEvent);
    expect(mapStage?.object.id).toContain(":node:lobby");
    expect(
      telemetryEventToXAPIStatement({
        name: "map_stage_viewed",
        ...base,
        data: { blockId: "map-1" },
      } as TelemetryEvent),
    ).toBeNull();

    const mapExit = telemetryEventToXAPIStatement({
      name: "map_exit_selected",
      ...base,
      data: { blockId: "map-1", fromStageId: "lobby", toStageId: "vault" },
    } as TelemetryEvent);
    expect(mapExit?.object.id).toContain(":node:vault");
    expect(
      telemetryEventToXAPIStatement({
        name: "map_exit_selected",
        courseId: base.courseId,
        timestamp: base.timestamp,
        data: { blockId: "map-1", toStageId: "vault" },
      } as TelemetryEvent),
    ).toBeNull();
  });

  it("keeps non-URL embed sources unchanged when sanitizing", () => {
    const embed = telemetryEventToXAPIStatement({
      name: "interaction",
      ...base,
      data: { kind: "embed_viewed", blockId: "embed-relative", src: "/local/embed.html" },
    });
    const ext = embed?.context?.extensions as Record<string, unknown> | undefined;
    expect(ext?.["https://lessonkit.dev/xapi/embedSrc"]).toBe("/local/embed.html");
  });

  it("maps branch_selected with NaN scoreWeight as experienced", () => {
    const branchSelected = telemetryEventToXAPIStatement({
      name: "branch_selected",
      courseId: "c1",
      lessonId: "l1",
      timestamp: "2026-01-01T00:00:00.000Z",
      sessionId: "s1",
      data: {
        blockId: "branch-1",
        fromNodeId: "offer",
        toNodeId: "supervisor",
        label: "Supervisor",
        scoreWeight: Number.NaN,
      },
    });
    expect(branchSelected?.verb).toBe("http://adlnet.gov/expapi/verbs/experienced");
    expect(branchSelected?.result).toBeUndefined();
  });

  it("throws for unknown event names", () => {
    expect(() =>
      telemetryEventToXAPIStatement({
        name: "unknown" as "course_started",
        courseId: base.courseId,
        timestamp: base.timestamp,
      }),
    ).toThrow(/Unhandled telemetry event/);
  });

  it("createXAPIClient uses mapper URNs", async () => {
    const statements: { object: { id: string } }[] = [];
    const client = createXAPIClient({
      courseId: "my-course",
      transport: async (s) => {
        statements.push(s);
      },
    });
    client.completeCourse();
    client.startedLesson({ lessonId: "lesson-1" });
    await Promise.resolve();
    expect(statements[0]?.object.id).toBe("urn:lessonkit:course:my-course");
    expect(statements[1]?.object.id).toBe("urn:lessonkit:course:my-course:lesson:lesson-1");
  });
});

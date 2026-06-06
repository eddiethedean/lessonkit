import { describe, expect, it, vi, afterEach } from "vitest";
import type { BuildTelemetryEventInput } from "../src/telemetryBuilder";
import {
  buildTelemetryEvent,
  tryBuildTelemetryEvent,
} from "../src/telemetryBuilder";
import { resetTelemetryBuilderWarningsForTests } from "../src/testing";

afterEach(() => {
  resetTelemetryBuilderWarningsForTests();
  vi.unstubAllEnvs();
});

describe("buildTelemetryEvent", () => {
  it("throws when lesson lifecycle events lack lessonId", () => {
    expect(() => buildTelemetryEvent({ name: "lesson_started", courseId: "c" })).toThrow(
      /lessonId/,
    );
  });

  it("lesson_completed uses opts.lessonId when data.lessonId conflicts", () => {
    const event = buildTelemetryEvent({
      name: "lesson_completed",
      courseId: "c",
      lessonId: "canonical",
      data: { lessonId: "wrong", durationMs: 5 },
    });
    expect(event.lessonId).toBe("canonical");
    if (event.name === "lesson_completed") {
      expect(event.data.lessonId).toBe("canonical");
      expect(event.data.durationMs).toBe(5);
    }
  });

  it("supports interaction without lessonId", () => {
    const event = buildTelemetryEvent({
      name: "interaction",
      courseId: "c",
      data: { kind: "noop" },
    });
    expect(event.name).toBe("interaction");
  });

  it("builds course lifecycle events", () => {
    expect(buildTelemetryEvent({ name: "course_started", courseId: "c" }).name).toBe("course_started");
    expect(buildTelemetryEvent({ name: "course_completed", courseId: "c" }).name).toBe("course_completed");
    expect(
      buildTelemetryEvent({
        name: "lesson_started",
        courseId: "c",
        lessonId: "l1",
      }).lessonId,
    ).toBe("l1");
    expect(
      buildTelemetryEvent({
        name: "quiz_completed",
        courseId: "c",
        lessonId: "l1",
        data: { checkId: "q1", score: 1 },
      }).name,
    ).toBe("quiz_completed");
  });

  it("lesson_started throws without lessonId", () => {
    expect(() => buildTelemetryEvent({ name: "lesson_started", courseId: "c" })).toThrow(/lessonId/);
  });

  it("default branch rejects unknown event names", () => {
    expect(() =>
      buildTelemetryEvent({
        name: "future_event",
        courseId: "c",
      } as unknown as BuildTelemetryEventInput),
    ).toThrow(/Unexpected value/);
  });

  it("builds quiz_answered with lessonId", () => {
    const event = buildTelemetryEvent({
      name: "quiz_answered",
      courseId: "c",
      lessonId: "l1",
      data: { checkId: "q1", question: "Q", choice: "A", correct: true },
    });
    expect(event.name).toBe("quiz_answered");
    expect(event.lessonId).toBe("l1");
  });

  it("quiz events require active lessonId", () => {
    expect(() =>
      buildTelemetryEvent({
        name: "quiz_answered",
        courseId: "c",
        data: { checkId: "q1", question: "Q", choice: "A", correct: false },
      }),
    ).toThrow(/lessonId/);
  });

  it("branch events require active lessonId", () => {
    expect(() =>
      buildTelemetryEvent({
        name: "branch_node_viewed",
        courseId: "c",
        data: { blockId: "bs-1", nodeId: "offer", nodeIndex: 0 },
      }),
    ).toThrow(/lessonId/);
    expect(() =>
      buildTelemetryEvent({
        name: "branch_selected",
        courseId: "c",
        data: {
          blockId: "bs-1",
          fromNodeId: "offer",
          toNodeId: "credit",
          label: "Credit",
        },
      }),
    ).toThrow(/lessonId/);
  });

  it("builds branch telemetry events", () => {
    expect(
      buildTelemetryEvent({
        name: "branch_node_viewed",
        courseId: "c",
        lessonId: "l1",
        data: { blockId: "bs-1", nodeId: "offer", nodeIndex: 0, nodeTitle: "Offer" },
      }).name,
    ).toBe("branch_node_viewed");
    expect(
      buildTelemetryEvent({
        name: "branch_selected",
        courseId: "c",
        lessonId: "l1",
        data: {
          blockId: "bs-1",
          fromNodeId: "offer",
          toNodeId: "credit",
          label: "Credit",
          scoreWeight: 1,
        },
      }).name,
    ).toBe("branch_selected");
  });

  it("builds compound and UI interaction telemetry events", () => {
    expect(
      buildTelemetryEvent({
        name: "compound_page_viewed",
        courseId: "c",
        lessonId: "l1",
        data: { blockId: "book-1", pageIndex: 0 },
      }).name,
    ).toBe("compound_page_viewed");
    expect(() =>
      buildTelemetryEvent({
        name: "compound_page_viewed",
        courseId: "c",
        data: { blockId: "book-1", pageIndex: 0 },
      }),
    ).toThrow(/lessonId/);
    expect(
      buildTelemetryEvent({
        name: "hotspot_opened",
        courseId: "c",
        lessonId: "l1",
        data: { blockId: "hs-1", hotspotId: "spot-1" },
      }).name,
    ).toBe("hotspot_opened");
    expect(
      buildTelemetryEvent({
        name: "accordion_section_toggled",
        courseId: "c",
        lessonId: "l1",
        data: { blockId: "acc-1", sectionId: "section-1", expanded: true },
      }).name,
    ).toBe("accordion_section_toggled");
    expect(
      buildTelemetryEvent({
        name: "flashcard_flipped",
        courseId: "c",
        lessonId: "l1",
        data: { blockId: "fc-1", cardIndex: 0, face: "back" },
      }).name,
    ).toBe("flashcard_flipped");
    expect(
      buildTelemetryEvent({
        name: "image_slider_changed",
        courseId: "c",
        lessonId: "l1",
        data: { blockId: "slider-1", slideIndex: 2 },
      }).name,
    ).toBe("image_slider_changed");
  });

  it("assessment_answered requires active lessonId", () => {
    expect(() =>
      buildTelemetryEvent({
        name: "assessment_answered",
        courseId: "c",
        data: { checkId: "tf-1", interactionType: "trueFalse", response: true },
      }),
    ).toThrow(/lessonId/);
  });

  it("builds assessment_completed with interactionType", () => {
    const event = buildTelemetryEvent({
      name: "assessment_completed",
      courseId: "c",
      lessonId: "l1",
      data: { checkId: "tf-1", interactionType: "trueFalse", score: 1, maxScore: 1 },
    });
    expect(event.name).toBe("assessment_completed");
    expect(event.data).toBeDefined();
    if (event.name === "assessment_completed") {
      expect(event.data.interactionType).toBe("trueFalse");
    }
  });
});

describe("tryBuildTelemetryEvent", () => {
  it("returns null and warns in dev when quiz events lack lessonId", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      tryBuildTelemetryEvent({
        name: "quiz_answered",
        courseId: "c",
        data: { checkId: "q1", question: "Q", choice: "A", correct: false },
      }),
    ).toBeNull();

    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/wrap <Quiz> in <Lesson>/));
    warn.mockRestore();
  });

  it("returns built events for valid quiz payloads", () => {
    const event = tryBuildTelemetryEvent({
      name: "quiz_completed",
      courseId: "c",
      lessonId: "lesson-1",
      data: { checkId: "q1", score: 1 },
    });
    expect(event?.name).toBe("quiz_completed");
  });
});

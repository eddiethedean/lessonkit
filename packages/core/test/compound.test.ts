import { describe, expect, it, vi } from "vitest";
import {
  clampCompoundPageIndex,
  createCompoundResumeState,
  parseCompoundResumeState,
  COMPOUND_RESUME_SCHEMA_VERSION,
} from "../src/compound";
import {
  compoundStateStorageKey,
  loadCompoundState,
  saveCompoundState,
  clearCompoundState,
} from "../src/compoundState";
import { createNoopStorage } from "../src/ports";
import { isChildTypeAllowed, getAllowedChildTypes } from "../src/compoundAllowlists";
import { buildTelemetryCatalogV3 } from "../src/telemetryCatalogV3";
import { buildTelemetryEvent } from "../src/telemetryBuilder";

describe("compound resume state", () => {
  it("round-trips via parse", () => {
    const state = createCompoundResumeState({
      activePageIndex: 2,
      childStates: { "check-1": { answer: "a" } },
    });
    expect(parseCompoundResumeState(state)).toEqual(state);
  });

  it("rejects invalid schema", () => {
    expect(parseCompoundResumeState(null)).toBeNull();
    expect(parseCompoundResumeState({ schemaVersion: 99 })).toBeNull();
  });

  it("clamps activePageIndex via clampCompoundPageIndex", () => {
    expect(clampCompoundPageIndex(99, 3)).toBe(2);
    expect(clampCompoundPageIndex(-1, 3)).toBe(0);
    expect(clampCompoundPageIndex(1, 0)).toBe(0);
  });

  it("drops invalid childStates entries", () => {
    const parsed = parseCompoundResumeState({
      schemaVersion: COMPOUND_RESUME_SCHEMA_VERSION,
      activePageIndex: 0,
      childStates: { valid: { a: 1 }, bad: null, alsoBad: "x" },
    });
    expect(parsed?.childStates).toEqual({ valid: { a: 1 } });
  });

  it("accepts one-level string maps in child states (drag/fill resume)", () => {
    const dragState = {
      zones: { "zone-0": "cats", "zone-1": "dogs" },
      pool: ["birds"],
      passed: false,
      submitted: true,
    };
    const fillState = {
      values: { "blank-0": "Paris", "blank-1": "France" },
      passed: true,
      submitted: true,
      showSolutions: false,
    };
    const parsed = parseCompoundResumeState({
      schemaVersion: COMPOUND_RESUME_SCHEMA_VERSION,
      activePageIndex: 0,
      childStates: { drag: dragState, fill: fillState },
    });
    expect(parsed?.childStates).toEqual({ drag: dragState, fill: fillState });
  });

  it("rejects child states with functions or deeply nested objects", () => {
    const parsed = parseCompoundResumeState({
      schemaVersion: COMPOUND_RESUME_SCHEMA_VERSION,
      activePageIndex: 0,
      childStates: {
        ok: { answer: "a", picks: [1, 2] },
        nested: { payload: { nested: { deep: true } } },
        fn: { run: () => {} },
      },
    });
    expect(parsed?.childStates).toEqual({ ok: { answer: "a", picks: [1, 2] } });
  });
});

describe("compound session storage", () => {
  it("saves and loads state", () => {
    const storage = createNoopStorage();
    const map = new Map<string, string>();
    storage.getItem = (k) => map.get(k) ?? null;
    storage.setItem = (k, v) => {
      map.set(k, v);
      return true;
    };
    storage.removeItem = (k) => map.delete(k);

    const state = createCompoundResumeState({ activePageIndex: 1 });
    saveCompoundState(storage, "course-1", "book-1", state);
    expect(compoundStateStorageKey("course-1", "book-1")).toContain("lessonkit:compound:");
    expect(loadCompoundState(storage, "course-1", "book-1")).toEqual(state);
    clearCompoundState(storage, "course-1", "book-1");
    expect(loadCompoundState(storage, "course-1", "book-1")).toBeNull();
  });

  it("warns in dev when compound state is corrupt", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const storage = createNoopStorage();
    const map = new Map<string, string>();
    storage.getItem = (k) => map.get(k) ?? null;
    storage.setItem = (k, v) => {
      map.set(k, v);
      return true;
    };

    map.set(compoundStateStorageKey("course-1", "book-1"), "not-json");
    expect(loadCompoundState(storage, "course-1", "book-1")).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("lessonkit:compound:course-1:book-1"),
    );

    warn.mockClear();
    map.set(
      compoundStateStorageKey("course-1", "book-2"),
      JSON.stringify({ schemaVersion: 99 }),
    );
    expect(loadCompoundState(storage, "course-1", "book-2")).toBeNull();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
    vi.unstubAllEnvs();
  });
});

describe("compound allowlists", () => {
  it("allows Quiz under Page", () => {
    expect(isChildTypeAllowed("Page", "Quiz")).toBe(true);
  });

  it("InteractiveBook only allows Page", () => {
    expect(getAllowedChildTypes("InteractiveBook")).toEqual(["Page"]);
  });

  it("SlideDeck only allows Slide", () => {
    expect(getAllowedChildTypes("SlideDeck")).toEqual(["Slide"]);
  });

  it("allows TrueFalse under Slide", () => {
    expect(isChildTypeAllowed("Slide", "TrueFalse")).toBe(true);
  });

  it("excludes ProgressTracker from Slide", () => {
    expect(isChildTypeAllowed("Slide", "ProgressTracker")).toBe(false);
  });

  it("InteractiveVideo only allows TimedCue", () => {
    expect(getAllowedChildTypes("InteractiveVideo")).toEqual(["TimedCue"]);
  });

  it("allows Video under Slide", () => {
    expect(isChildTypeAllowed("Slide", "Video")).toBe(true);
  });

  it("allows Summary under TimedCue", () => {
    expect(isChildTypeAllowed("TimedCue", "Summary")).toBe(true);
  });
});

describe("telemetry catalog v3", () => {
  it("includes book_page_viewed and slide_viewed", () => {
    const names = buildTelemetryCatalogV3().map((e) => e.name);
    expect(names).toContain("book_page_viewed");
    expect(names).toContain("slide_viewed");
    expect(names).toContain("video_cue_reached");
    expect(names).toContain("video_segment_completed");
  });

  it("builds book_page_viewed events", () => {
    const event = buildTelemetryEvent({
      name: "book_page_viewed",
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      data: { blockId: "book-1", pageIndex: 0, pageTitle: "Intro" },
    });
    expect(event.name).toBe("book_page_viewed");
    if (event.name === "book_page_viewed") {
      expect(event.data.pageIndex).toBe(0);
    }
  });

  it("builds slide_viewed events", () => {
    const event = buildTelemetryEvent({
      name: "slide_viewed",
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      data: { blockId: "deck-1", slideIndex: 1, slideTitle: "Overview" },
    });
    expect(event.name).toBe("slide_viewed");
    if (event.name === "slide_viewed") {
      expect(event.data.slideIndex).toBe(1);
      expect(event.data.slideTitle).toBe("Overview");
    }
  });

  it("builds 1.4 video and content interaction events", () => {
    const cue = buildTelemetryEvent({
      name: "video_cue_reached",
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      data: { blockId: "iv-1", cueIndex: 0, atSeconds: 5, cueLabel: "Check" },
    });
    expect(cue.name).toBe("video_cue_reached");
    if (cue.name === "video_cue_reached") {
      expect(cue.data.cueLabel).toBe("Check");
    }

    const segment = buildTelemetryEvent({
      name: "video_segment_completed",
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      data: { blockId: "iv-1", segmentIndex: 0, atSeconds: 5, segmentLabel: "Check" },
    });
    expect(segment.name).toBe("video_segment_completed");

    const memory = buildTelemetryEvent({
      name: "memory_card_flipped",
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      data: { blockId: "mem-1", cardIndex: 2, face: "back" },
    });
    expect(memory.name).toBe("memory_card_flipped");

    const search = buildTelemetryEvent({
      name: "information_wall_search",
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      data: { blockId: "wall-1", query: "ppe", resultCount: 1 },
    });
    expect(search.name).toBe("information_wall_search");

    const slide = buildTelemetryEvent({
      name: "parallax_slide_viewed",
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      data: { blockId: "para-1", slideIndex: 1 },
    });
    expect(slide.name).toBe("parallax_slide_viewed");

    const survey = buildTelemetryEvent({
      name: "questionnaire_submitted",
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      data: { blockId: "survey-1", fieldCount: 3 },
    });
    expect(survey.name).toBe("questionnaire_submitted");
  });
});

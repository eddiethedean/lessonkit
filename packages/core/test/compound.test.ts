import { describe, expect, it } from "vitest";
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
});

describe("compound session storage", () => {
  it("saves and loads state", () => {
    const storage = createNoopStorage();
    const map = new Map<string, string>();
    storage.getItem = (k) => map.get(k) ?? null;
    storage.setItem = (k, v) => map.set(k, v);
    storage.removeItem = (k) => map.delete(k);

    const state = createCompoundResumeState({ activePageIndex: 1 });
    saveCompoundState(storage, "course-1", "book-1", state);
    expect(compoundStateStorageKey("course-1", "book-1")).toContain("lessonkit:compound:");
    expect(loadCompoundState(storage, "course-1", "book-1")).toEqual(state);
    clearCompoundState(storage, "course-1", "book-1");
    expect(loadCompoundState(storage, "course-1", "book-1")).toBeNull();
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
});

describe("telemetry catalog v3", () => {
  it("includes book_page_viewed and slide_viewed", () => {
    const names = buildTelemetryCatalogV3().map((e) => e.name);
    expect(names).toContain("book_page_viewed");
    expect(names).toContain("slide_viewed");
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
});

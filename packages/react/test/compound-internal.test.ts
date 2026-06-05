import { describe, expect, it, vi } from "vitest";
import type { AssessmentHandle } from "@lessonkit/core";
import { compoundStateStorageKey, createCompoundResumeState } from "@lessonkit/core";
import { resumeChildHandles } from "../src/compound/resumeChildHandles";
import { readCompoundInitialIndex } from "../src/compound/useCompoundPersistence";
import { createSessionStoragePort } from "../src/runtime/ports";

describe("resumeChildHandles", () => {
  it("resumes registered child handles from saved state", () => {
    const resume = vi.fn();
    const handles = new Map<string, AssessmentHandle>([
      ["check-1", { resume } as unknown as AssessmentHandle],
    ]);
    resumeChildHandles(handles, { "check-1": { selected: true } });
    expect(resume).toHaveBeenCalledWith({ selected: true });
  });

  it("waits until all child state keys have registered handles", () => {
    const resume = vi.fn();
    const handles = new Map<string, AssessmentHandle>([
      ["check-1", { resume } as unknown as AssessmentHandle],
    ]);
    const applied = resumeChildHandles(
      handles,
      { "check-1": { selected: true }, "check-2": { selected: false } },
      { waitForHandles: true },
    );
    expect(applied).toBe(false);
    expect(resume).not.toHaveBeenCalled();
  });
});

describe("readCompoundInitialIndex", () => {
  it("returns clamped saved index from injected storage", () => {
    const storage = createSessionStoragePort();
    storage.setItem(
      compoundStateStorageKey("course-1", "book-1"),
      JSON.stringify(createCompoundResumeState({ activePageIndex: 2, childStates: {} })),
    );
    expect(readCompoundInitialIndex("course-1", "book-1", 3, true, storage)).toBe(2);
  });

  it("returns 0 when persistence disabled", () => {
    const storage = createSessionStoragePort();
    storage.setItem(
      compoundStateStorageKey("course-1", "book-1"),
      JSON.stringify(createCompoundResumeState({ activePageIndex: 2, childStates: {} })),
    );
    expect(readCompoundInitialIndex("course-1", "book-1", 3, false, storage)).toBe(0);
  });
});

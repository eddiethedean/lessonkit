import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AssessmentHandle } from "@lessonkit/core";
import {
  compoundStateStorageKey,
  createCompoundResumeState,
  saveCompoundState,
} from "@lessonkit/core";
import { filterRegisteredChildStates, resumeChildHandles } from "../src/compound/resumeChildHandles";
import { useCompoundResume } from "../src/compound/useCompoundResume";
import { readCompoundInitialIndex } from "../src/compound/useCompoundPersistence";
import { createSessionStoragePort } from "../src/runtime/ports";

afterEach(() => {
  cleanup();
});

describe("filterRegisteredChildStates", () => {
  it("drops child state keys without registered handles", () => {
    const handles = new Map<string, AssessmentHandle>([
      ["check-2", {} as AssessmentHandle],
    ]);
    expect(
      filterRegisteredChildStates(handles, {
        "check-1": { selected: true },
        "check-2": { selected: false },
      }),
    ).toEqual({ "check-2": { selected: false } });
  });
});

describe("resumeChildHandles", () => {
  it("resumes registered child handles from saved state", () => {
    const resume = vi.fn();
    const handles = new Map<string, AssessmentHandle>([
      ["check-1", { resume } as unknown as AssessmentHandle],
    ]);
    resumeChildHandles(handles, { "check-1": { selected: true } });
    expect(resume).toHaveBeenCalledWith({ selected: true });
  });

  it("waits until handles mount when saved keys are not yet registered", () => {
    const resume = vi.fn();
    const handles = new Map<string, AssessmentHandle>();
    const applied = resumeChildHandles(
      handles,
      { "check-1": { selected: true } },
      { waitForHandles: true },
    );
    expect(applied).toBe(false);
    expect(resume).not.toHaveBeenCalled();
  });

  it("resumes registered keys while waiting for remaining pending handles", () => {
    const resume = vi.fn();
    const handles = new Map<string, AssessmentHandle>([
      ["check-2", { resume } as unknown as AssessmentHandle],
    ]);
    const applied = resumeChildHandles(
      handles,
      { "check-1": { selected: true }, "check-2": { selected: false } },
      { waitForHandles: true },
    );
    expect(applied).toBe(false);
    expect(resume).toHaveBeenCalledWith({ selected: false });
  });

  it("finalizes orphan keys when no handles will register", () => {
    const handles = new Map<string, AssessmentHandle>();
    const applied = resumeChildHandles(
      handles,
      { "check-1": { selected: true } },
      { waitForHandles: true },
    );
    expect(applied).toBe(false);
  });

  it("waits for lazy mounts when only some pending keys are registered", () => {
    const resumeA = vi.fn();
    const resumeB = vi.fn();
    const alreadyResumed = new Set<string>();
    const handles = new Map<string, AssessmentHandle>([
      ["check-1", { resume: resumeA } as unknown as AssessmentHandle],
    ]);
    const applied = resumeChildHandles(
      handles,
      { "check-1": { selected: "a" }, "check-2": { selected: "b" } },
      { waitForHandles: true, alreadyResumed },
    );
    expect(applied).toBe(false);
    expect(resumeA).toHaveBeenCalledWith({ selected: "a" });
    expect(resumeB).not.toHaveBeenCalled();

    handles.set("check-2", { resume: resumeB } as unknown as AssessmentHandle);
    const completed = resumeChildHandles(
      handles,
      { "check-1": { selected: "a" }, "check-2": { selected: "b" } },
      { waitForHandles: true, alreadyResumed },
    );
    expect(completed).toBe(true);
    expect(resumeA).toHaveBeenCalledTimes(1);
    expect(resumeB).toHaveBeenCalledWith({ selected: "b" });
  });

  it("waits when pending keys match no registered handles yet", () => {
    const resume = vi.fn();
    const handles = new Map<string, AssessmentHandle>([
      ["check-B", { resume } as unknown as AssessmentHandle],
    ]);
    const applied = resumeChildHandles(
      handles,
      { "check-A": { selected: true } },
      { waitForHandles: true },
    );
    expect(applied).toBe(false);
    expect(resume).not.toHaveBeenCalled();
  });
});

describe("useCompoundResume", () => {
  it("re-runs resume when enabled toggles from false to true", () => {
    const storage = createSessionStoragePort();
    saveCompoundState(
      storage,
      "course-1",
      "book-1",
      createCompoundResumeState({ activePageIndex: 2 }),
    );
    const onResume = vi.fn();

    function Probe({ enabled }: { enabled: boolean }) {
      useCompoundResume({
        courseId: "course-1",
        compoundId: "book-1",
        enabled,
        storage,
        onResume,
      });
      return null;
    }

    const { rerender } = render(React.createElement(Probe, { enabled: false }));
    expect(onResume).not.toHaveBeenCalled();

    rerender(React.createElement(Probe, { enabled: true }));
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onResume.mock.calls[0]?.[0]?.activePageIndex).toBe(2);
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

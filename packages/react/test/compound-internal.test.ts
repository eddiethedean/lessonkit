import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AssessmentHandle } from "@lessonkit/core";
import {
  compoundStateStorageKey,
  createCompoundResumeState,
  saveCompoundState,
} from "@lessonkit/core";
import { filterRegisteredChildStates, registerablePendingKeys, resumeChildHandles } from "../src/compound/resumeChildHandles";
import { BS_META_KEY } from "../src/compound/useCompoundBranchShell";
import {
  markCompoundHydrated,
  resetCompoundHydrationKeys,
} from "../src/compound/compoundHydration";
import { useCompoundResume, resetCompoundPersistFailureWarnings } from "../src/compound/useCompoundResume";
import { readCompoundInitialIndex } from "../src/compound/useCompoundPersistence";
import { shouldReplayResumeTelemetry } from "../src/assessment/shouldReplayResumeTelemetry";
import {
  IV_META_KEY,
  mergeVideoMetaIntoState,
  readInteractiveVideoMeta,
} from "../src/compound/useCompoundVideoShell";
import { createSessionStoragePort } from "../src/runtime/ports";

afterEach(() => {
  cleanup();
  resetCompoundHydrationKeys();
  resetCompoundPersistFailureWarnings();
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

  it("completes wait-for-handles when only preserved meta keys are pending", () => {
    const resume = vi.fn();
    const handles = new Map<string, AssessmentHandle>([
      ["check-1", { resume } as unknown as AssessmentHandle],
    ]);
    const applied = resumeChildHandles(
      handles,
      {
        [BS_META_KEY]: { activeNodeId: "start" },
        "check-1": { selected: true },
      },
      { waitForHandles: true },
    );
    expect(applied).toBe(true);
    expect(resume).toHaveBeenCalledWith({ selected: true });
  });

  it("registerablePendingKeys excludes branch and video meta", () => {
    expect(
      registerablePendingKeys({
        [BS_META_KEY]: { activeNodeId: "start" },
        [IV_META_KEY]: { currentTime: 1 },
        "check-1": { selected: true },
      }),
    ).toEqual(["check-1"]);
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

  it("skips mount load when compound was already hydrated by persistence", () => {
    const storage = createSessionStoragePort();
    saveCompoundState(
      storage,
      "course-1",
      "book-hydrated",
      createCompoundResumeState({ activePageIndex: 3 }),
    );
    const onResume = vi.fn();
    markCompoundHydrated("course-1:book-hydrated");

    function Probe() {
      useCompoundResume({
        courseId: "course-1",
        compoundId: "book-hydrated",
        enabled: true,
        storage,
        onResume,
      });
      return null;
    }

    render(React.createElement(Probe));
    expect(onResume).not.toHaveBeenCalled();
  });

  it("warns per compound id when persist fails", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const storage = createSessionStoragePort();
    storage.setItem = () => false;

    function Probe({ compoundId }: { compoundId: string }) {
      const save = useCompoundResume({
        courseId: "course-1",
        compoundId,
        enabled: true,
        storage,
      });
      save(createCompoundResumeState({ activePageIndex: 0 }));
      return null;
    }

    render(React.createElement(Probe, { compoundId: "book-a" }));
    render(React.createElement(Probe, { compoundId: "book-b" }));
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]?.[0]).toContain("book-a");
    expect(warn.mock.calls[1]?.[0]).toContain("book-b");

    warn.mockClear();
    render(React.createElement(Probe, { compoundId: "book-a" }));
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
    vi.unstubAllEnvs();
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

describe("shouldReplayResumeTelemetry", () => {
  it("defaults to false unless replayResumeEvents is true", () => {
    expect(shouldReplayResumeTelemetry(undefined)).toBe(false);
    expect(shouldReplayResumeTelemetry({ tracking: {} })).toBe(false);
    expect(shouldReplayResumeTelemetry({ tracking: { replayResumeEvents: true } })).toBe(true);
  });
});

describe("readInteractiveVideoMeta", () => {
  it("reads firedCueIndices and falls back to completedCueIndices", () => {
    expect(
      readInteractiveVideoMeta({
        [IV_META_KEY]: { currentTime: 12, completedCueIndices: [0], firedCueIndices: [0, 1] },
      }),
    ).toEqual({ currentTime: 12, completedCueIndices: [0], firedCueIndices: [0, 1] });

    expect(
      readInteractiveVideoMeta({
        [IV_META_KEY]: { currentTime: 5, completedCueIndices: [0] },
      }),
    ).toEqual({ currentTime: 5, completedCueIndices: [0], firedCueIndices: [0] });
  });

  it("persists firedCueIndices via mergeVideoMetaIntoState", () => {
    const merged = mergeVideoMetaIntoState(createCompoundResumeState(), {
      currentTime: 9,
      completedCueIndices: [0],
      firedCueIndices: [0, 1],
    });
    expect(merged.childStates[IV_META_KEY]).toEqual({
      currentTime: 9,
      completedCueIndices: [0],
      firedCueIndices: [0, 1],
    });
  });
});

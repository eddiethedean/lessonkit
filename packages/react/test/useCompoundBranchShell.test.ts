import { describe, expect, it } from "vitest";
import {
  applyChoiceScoreUpdate,
  BS_META_KEY,
  createInitialBranchMeta,
  mergeBranchMetaIntoState,
  readBranchingScenarioMeta,
  sanitizeBranchMeta,
} from "../src/compound/useCompoundBranchShell";
import { createCompoundResumeState } from "@lessonkit/core";
import { filterRegisteredChildStates } from "../src/compound/resumeChildHandles";

describe("useCompoundBranchShell", () => {
  const nodeIndexMap = new Map([
    ["offer", 0],
    ["credit", 1],
    ["supervisor", 2],
  ]);

  it("sanitizeBranchMeta resets unknown active node to start", () => {
    const meta = sanitizeBranchMeta(
      { activeNodeId: "missing", visitedNodeIds: ["missing", "credit"] },
      nodeIndexMap,
      "offer",
    );
    expect(meta.activeNodeId).toBe("offer");
    expect(meta.visitedNodeIds).toEqual(["credit", "offer"]);
  });

  it("applyChoiceScoreUpdate replaces prior choice from same node", () => {
    const first = applyChoiceScoreUpdate(undefined, "offer", "credit", 5);
    const second = applyChoiceScoreUpdate(first, "offer", "supervisor", 3);
    expect(second).toEqual({ "offer:supervisor": 3 });
  });

  it("mergeBranchMetaIntoState includes __lk_bs__", () => {
    const state = createCompoundResumeState({ activePageIndex: 1, childStates: { q1: { answer: "a" } } });
    const meta = createInitialBranchMeta("credit");
    const merged = mergeBranchMetaIntoState(state, meta);
    expect(readBranchingScenarioMeta(merged.childStates)?.activeNodeId).toBe("credit");
  });
});

describe("filterRegisteredChildStates", () => {
  it("preserves branch graph meta key", () => {
    const handles = new Map<string, import("@lessonkit/core").AssessmentHandle>();
    const meta = { activeNodeId: "credit", visitedNodeIds: ["offer", "credit"] };
    const filtered = filterRegisteredChildStates(handles, {
      [BS_META_KEY]: meta,
      "credit-check": { answer: true },
    });
    expect(filtered[BS_META_KEY]).toEqual(meta);
    expect(filtered["credit-check"]).toBeUndefined();
  });
});

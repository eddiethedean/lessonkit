import { describe, expect, it, vi } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import {
  dispatchBridgeAction,
  forwardTelemetryToBridge,
  getLxpackBridge,
  isParentOriginAllowed,
  normalizeAssessmentPassingScore,
  normalizeAssessmentScore,
  notifyLxpackLessonComplete,
  resolveParentOrigin,
} from "../src/bridge";
import type { LxpackBridgeV1 } from "../src/bridge";

vi.mock("@lxpack/spa-bridge", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@lxpack/spa-bridge")>();
  return {
    ...mod,
    getLxpackBridge: vi.fn(() => null),
  };
});

describe("@lessonkit/lxpack/bridge", () => {
  it("normalizeAssessmentScore scales raw points when score > 1", () => {
    expect(normalizeAssessmentScore({ score: 2, maxScore: 4 })).toBe(0.5);
    expect(normalizeAssessmentScore({ score: 2, maxScore: 2 })).toBe(1);
  });

  it("normalizeAssessmentScore scales partial raw points when maxScore > 1", () => {
    expect(normalizeAssessmentScore({ score: 1, maxScore: 2 })).toBe(0.5);
    expect(normalizeAssessmentScore({ score: 1, maxScore: 4 })).toBe(0.25);
    expect(normalizeAssessmentScore({ score: 0.5, maxScore: 2 })).toBe(0.25);
  });

  it("normalizeAssessmentScore treats values already on 0–1 scale when maxScore is 1", () => {
    expect(normalizeAssessmentScore({ score: 1, maxScore: 1 })).toBe(1);
    expect(normalizeAssessmentScore({ score: 0.5 })).toBe(0.5);
  });

  it("normalizeAssessmentScore treats percentage raw scores without maxScore", () => {
    expect(normalizeAssessmentScore({ score: 75 })).toBe(0.75);
  });

  it("normalizeAssessmentScore clamps to 1", () => {
    expect(normalizeAssessmentScore({ score: 3, maxScore: 2 })).toBe(1);
    expect(normalizeAssessmentScore({ score: 150 })).toBe(1);
  });

  it("normalizeAssessmentScore returns null when score is missing", () => {
    expect(normalizeAssessmentScore({})).toBeNull();
    expect(normalizeAssessmentScore({ maxScore: 2 })).toBeNull();
  });

  it("normalizeAssessmentPassingScore uses LXPack default when omitted", () => {
    expect(normalizeAssessmentPassingScore()).toBe(0.7);
    expect(normalizeAssessmentPassingScore({ passingScore: 0.8 })).toBe(0.8);
  });

  it("normalizeAssessmentPassingScore scales raw threshold by maxScore", () => {
    expect(normalizeAssessmentPassingScore({ passingScore: 2, maxScore: 4 })).toBe(0.5);
    expect(normalizeAssessmentPassingScore({ passingScore: 1, maxScore: 4 })).toBe(0.25);
    expect(normalizeAssessmentPassingScore({ passingScore: 1, maxScore: 1 })).toBe(1);
  });

  it("normalizeAssessmentPassingScore clamps to 1", () => {
    expect(normalizeAssessmentPassingScore({ passingScore: 3, maxScore: 2 })).toBe(1);
  });

  it("normalizeAssessmentPassingScore treats percentage thresholds without maxScore", () => {
    expect(normalizeAssessmentPassingScore({ passingScore: 80 })).toBe(0.8);
  });

  it("dispatchBridgeAction swallows host bridge throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const bridge = {
      completeCourse: () => {
        throw new Error("bridge exploded");
      },
    } as unknown as LxpackBridgeV1;

    expect(() =>
      dispatchBridgeAction(bridge, { kind: "completeCourse" }),
    ).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("lxpack bridge action failed"),
      "bridge exploded",
    );

    process.env.NODE_ENV = prevEnv;
    warn.mockRestore();
  });

  it("resolves parent.lxpackBridge.v1 when SDK helper returns null", () => {
    const completeLesson = vi.fn();
    const parent = {
      lxpackBridge: { v1: { completeLesson } },
    };
    vi.stubGlobal("window", { parent });

    try {
      expect(notifyLxpackLessonComplete("lesson-1")).toBe(true);
      expect(completeLesson).toHaveBeenCalledWith("lesson-1");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("forwards assessment_completed to submitAssessment", () => {
    const submitAssessment = vi.fn();
    vi.stubGlobal("window", {
      parent: { lxpackBridge: { v1: { submitAssessment } } },
    });

    const event: TelemetryEvent = {
      name: "assessment_completed",
      courseId: "c",
      lessonId: "l1",
      sessionId: "s",
      timestamp: "2026-01-01T00:00:00.000Z",
      data: {
        checkId: "tf-1",
        interactionType: "trueFalse",
        score: 1,
        maxScore: 1,
      },
    };

    try {
      forwardTelemetryToBridge(event, "auto");
      expect(submitAssessment).toHaveBeenCalledWith({
        id: "tf-1",
        score: 1,
        maxScore: 1,
        passingScore: 0.7,
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("forwardTelemetryToBridge swallows host bridge throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const parent = {
      lxpackBridge: {
        v1: {
          track: () => {
            throw new Error("track failed");
          },
        } as unknown as LxpackBridgeV1,
      },
    } as unknown as Window;

    const event: TelemetryEvent = {
      name: "interaction",
      courseId: "c",
      sessionId: "s",
      timestamp: "t",
      data: { kind: "click", blockId: "b1" },
      lessonId: "l1",
    };

    expect(() =>
      forwardTelemetryToBridge(event, "auto", parent as unknown as Window),
    ).not.toThrow();

    process.env.NODE_ENV = prevEnv;
    warn.mockRestore();
  });

  it("calls onBridgeError when assessment_completed bridge throws", () => {
    const onBridgeError = vi.fn();
    const submitAssessment = vi.fn(() => {
      throw new Error("submit failed");
    });
    vi.stubGlobal("window", {
      parent: { lxpackBridge: { v1: { submitAssessment } } },
    });

    const event: TelemetryEvent = {
      name: "assessment_completed",
      courseId: "c",
      lessonId: "l1",
      sessionId: "s",
      timestamp: "2026-01-01T00:00:00.000Z",
      data: {
        checkId: "tf-1",
        interactionType: "trueFalse",
        score: 1,
        maxScore: 1,
      },
    };

    try {
      expect(() => forwardTelemetryToBridge(event, "auto", undefined, { onBridgeError })).not.toThrow();
      expect(onBridgeError).toHaveBeenCalledWith(expect.any(Error));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("blocks bridge calls when parent origin is not allowlisted", () => {
    const completeLesson = vi.fn();
    vi.stubGlobal("window", {
      parent: {
        location: { origin: "https://evil.example" },
        lxpackBridge: { v1: { completeLesson } },
      },
      location: { origin: "https://course.example" },
    });

    try {
      expect(
        notifyLxpackLessonComplete("lesson-1", {
          allowedParentOrigins: ["https://lms.example"],
        }),
      ).toBe(false);
      expect(completeLesson).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("allows bridge calls when parent origin matches allowlist", () => {
    const completeLesson = vi.fn();
    vi.stubGlobal("window", {
      parent: {
        location: { origin: "https://lms.example" },
        lxpackBridge: { v1: { completeLesson } },
      },
      location: { origin: "https://course.example" },
    });

    try {
      expect(
        notifyLxpackLessonComplete("lesson-1", {
          allowedParentOrigins: ["https://lms.example"],
        }),
      ).toBe(true);
      expect(completeLesson).toHaveBeenCalledWith("lesson-1");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("resolveParentOrigin falls back to document.referrer", () => {
    vi.stubGlobal("document", { referrer: "https://lms.example/course/launch" });
    vi.stubGlobal("window", {
      parent: {
        get location() {
          throw new Error("cross-origin");
        },
      },
    });

    try {
      expect(resolveParentOrigin()).toBe("https://lms.example");
      expect(isParentOriginAllowed(["https://lms.example"])).toBe(true);
      expect(isParentOriginAllowed(["https://other.example"])).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("denies auto bridge in production without allowedParentOrigins", () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(isParentOriginAllowed(undefined, undefined, "auto")).toBe(false);
      expect(isParentOriginAllowed(undefined, undefined, undefined)).toBe(false);
      expect(
        getLxpackBridge(undefined, { allowedParentOrigins: ["https://lms.example"], mode: "auto" }),
      ).toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("notifyLxpackLessonComplete swallows host bridge throws", () => {
    const onBridgeError = vi.fn();
    vi.stubGlobal("window", {
      parent: {
        location: { origin: "https://lms.example" },
        lxpackBridge: {
          v1: {
            completeLesson: () => {
              throw new Error("host bridge failure");
            },
          },
        },
      },
      location: { origin: "https://course.example" },
    });

    try {
      expect(
        notifyLxpackLessonComplete("lesson-1", {
          allowedParentOrigins: ["https://lms.example"],
          onBridgeError,
        }),
      ).toBe(false);
      expect(onBridgeError).toHaveBeenCalledWith(expect.any(Error));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("denies notify APIs in production without allowedParentOrigins regardless of mode", () => {
    const completeLesson = vi.fn();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("window", {
      parent: {
        location: { origin: "https://lms.example" },
        lxpackBridge: { v1: { completeLesson } },
      },
      location: { origin: "https://course.example" },
    });

    try {
      expect(notifyLxpackLessonComplete("lesson-1")).toBe(false);
      expect(completeLesson).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    }
  });

  it("getLxpackBridge returns null when origin is not allowlisted", () => {
    vi.stubGlobal("window", {
      parent: {
        location: { origin: "https://evil.example" },
        lxpackBridge: { v1: { completeCourse: vi.fn() } },
      },
    });

    try {
      expect(getLxpackBridge(undefined, { allowedParentOrigins: ["https://lms.example"] })).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("forwards branch telemetry via bridge.track", () => {
    const track = vi.fn();
    vi.stubGlobal("window", {
      parent: { lxpackBridge: { v1: { track } } },
    });

    forwardTelemetryToBridge(
      {
        name: "branch_selected",
        courseId: "c",
        lessonId: "l1",
        sessionId: "s",
        timestamp: "2026-01-01T00:00:00.000Z",
        data: {
          blockId: "bs-1",
          fromNodeId: "offer",
          toNodeId: "credit",
          label: "Credit",
        },
      } as TelemetryEvent,
      "auto",
    );

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "interaction",
        id: "branch_selected",
        data: expect.objectContaining({ toNodeId: "credit" }),
      }),
    );

    vi.unstubAllGlobals();
  });
});

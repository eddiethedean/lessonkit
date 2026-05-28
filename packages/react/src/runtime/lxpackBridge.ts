import type { QuizCompletedData, TelemetryEvent } from "@lessonkit/core";

export type LxpackBridgeMode = "auto" | "off";

let bridgeMode: LxpackBridgeMode = "auto";

export function setLxpackBridgeMode(mode: LxpackBridgeMode): void {
  bridgeMode = mode;
}

type LxpackBridgeV1 = {
  completeLesson?: (lessonId: string) => void;
  completeCourse?: () => void;
  submitAssessment?: (payload: {
    id: string;
    score: number;
    passingScore?: number;
  }) => void;
};

function getBridge(): LxpackBridgeV1 | null {
  if (typeof window === "undefined") return null;
  const parent = window.parent as {
    lxpackBridge?: { v1?: LxpackBridgeV1 };
    lxpack?: LxpackBridgeV1;
  } | null;
  if (!parent || parent === window) return null;
  return parent.lxpackBridge?.v1 ?? parent.lxpack ?? null;
}

export function forwardTelemetryToLxpack(event: TelemetryEvent): void {
  if (bridgeMode === "off") return;
  const bridge = getBridge();
  if (!bridge) return;

  switch (event.name) {
    case "lesson_completed": {
      const lessonId = event.lessonId;
      if (lessonId) bridge.completeLesson?.(lessonId);
      return;
    }
    case "course_completed":
      bridge.completeCourse?.();
      return;
    case "quiz_completed": {
      const data = event.data as QuizCompletedData | undefined;
      if (!data?.checkId) return;
      const maxScore = typeof data.maxScore === "number" && data.maxScore > 0 ? data.maxScore : 1;
      const raw = typeof data.score === "number" ? data.score : 1;
      bridge.submitAssessment?.({
        id: data.checkId,
        score: raw / maxScore,
        passingScore: 1,
      });
      return;
    }
    default:
      return;
  }
}

import type { LessonkitConfig } from "../context";

/** Whether assessment blocks should re-emit telemetry when restoring saved state. */
export function shouldReplayResumeTelemetry(
  config: Pick<LessonkitConfig, "tracking"> | undefined,
): boolean {
  return config?.tracking?.replayResumeEvents === true;
}

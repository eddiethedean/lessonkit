import type { CourseId, LessonId } from "../identityTypes";
import type { TelemetryEvent, TelemetryEventName, TelemetryUser } from "../telemetryTypes";
import type { PluginRegistry } from "../plugins/types";
import { createDefaultClock, createSessionStoragePort, type ClockPort, type StoragePort } from "../ports";
import { createProgressController, type ProgressController, type ProgressState } from "../progress";
import { resolveSessionId } from "../session";
import { tryBuildTelemetryEvent } from "../telemetryBuilder";
import type { TelemetryDataFor } from "../telemetryTypes";

export type LessonkitRuntimeVersion = "v1" | "v2";

export type HeadlessLessonkitConfig = {
  courseId: CourseId;
  runtimeVersion?: LessonkitRuntimeVersion;
  session?: {
    sessionId?: string;
    attemptId?: string;
    user?: TelemetryUser;
  };
  plugins?: PluginRegistry | null;
};

export type HeadlessRuntimePorts = {
  storage?: StoragePort;
  clock?: ClockPort;
};

export type TelemetryEmitFn = {
  <N extends TelemetryEventName>(
    name: N,
    data?: TelemetryDataFor<N>,
    lessonId?: LessonId,
  ): void;
};

export type HeadlessLessonkitRuntime = {
  readonly config: HeadlessLessonkitConfig;
  readonly progress: ProgressController;
  getProgressState: () => ProgressState;
  getSession: () => { sessionId: string; attemptId?: string; user?: TelemetryUser };
  updateConfig: (next: Partial<HeadlessLessonkitConfig>) => void;
  setActiveLesson: (lessonId: LessonId, emit: TelemetryEmitFn) => void;
  completeLesson: (lessonId: LessonId, emit: TelemetryEmitFn) => void;
  completeCourse: (emit: TelemetryEmitFn) => void;
  track: <N extends TelemetryEventName>(
    name: N,
    data: TelemetryDataFor<N> | undefined,
    emit: (event: TelemetryEvent) => void,
    lessonId?: LessonId,
  ) => void;
  resetForCourseChange: (courseId: CourseId) => void;
};

export function createLessonkitRuntime(
  config: HeadlessLessonkitConfig,
  ports: HeadlessRuntimePorts = {},
): HeadlessLessonkitRuntime {
  const storage = ports.storage ?? createSessionStoragePort();
  const clock = ports.clock ?? createDefaultClock();

  const configSnapshot: HeadlessLessonkitConfig = { ...config };

  let sessionId = resolveSessionId(storage, configSnapshot.session?.sessionId);
  let attemptId = configSnapshot.session?.attemptId;
  let user = configSnapshot.session?.user;
  let courseId = configSnapshot.courseId;

  let progress = createProgressController();

  const getSession = () => ({ sessionId, attemptId, user });

  const syncSessionFromConfig = (next: HeadlessLessonkitConfig) => {
    sessionId = resolveSessionId(storage, next.session?.sessionId);
    attemptId = next.session?.attemptId;
    user = next.session?.user;
    courseId = next.courseId;
  };

  syncSessionFromConfig(configSnapshot);

  const track = <N extends TelemetryEventName>(
    name: N,
    data: TelemetryDataFor<N> | undefined,
    emit: (event: TelemetryEvent) => void,
    lessonId?: LessonId,
  ) => {
    const event = tryBuildTelemetryEvent({
      name,
      courseId,
      lessonId: lessonId ?? progress.getState().activeLessonId,
      sessionId,
      attemptId,
      user,
      data,
    } as Parameters<typeof tryBuildTelemetryEvent>[0]);
    if (!event) return;
    emit(event);
  };

  const emitLessonCompleted = (
    lessonId: LessonId,
    durationMs: number | undefined,
    emitFn: TelemetryEmitFn,
  ) => {
    emitFn("lesson_completed", { lessonId, durationMs }, lessonId);
    if (durationMs !== undefined) {
      emitFn("lesson_time_on_task", { lessonId, durationMs }, lessonId);
    }
  };

  return {
    get config() {
      return configSnapshot;
    },
    get progress() {
      return progress;
    },
    getProgressState: () => progress.getState(),
    getSession,
    updateConfig(next) {
      if (next.courseId !== undefined) configSnapshot.courseId = next.courseId;
      if (next.runtimeVersion !== undefined) configSnapshot.runtimeVersion = next.runtimeVersion;
      if (next.plugins !== undefined) configSnapshot.plugins = next.plugins;
      if (next.session !== undefined) {
        configSnapshot.session = { ...configSnapshot.session, ...next.session };
      }
      syncSessionFromConfig(configSnapshot);
    },
    setActiveLesson(lessonId, emitFn) {
      const current = progress.getState();
      if (current.activeLessonId === lessonId) return;
      if (current.completedLessonIds.has(lessonId)) {
        progress.setActiveLesson(lessonId, clock.nowMs());
        return;
      }

      const previous = current.activeLessonId;
      if (previous && previous !== lessonId) {
        const completed = progress.completeLesson(previous, clock.nowMs());
        if (completed.didComplete) {
          emitLessonCompleted(previous, completed.durationMs, emitFn);
        }
      }

      progress.setActiveLesson(lessonId, clock.nowMs());
      emitFn("lesson_started", { lessonId }, lessonId);
    },
    completeLesson(lessonId, emitFn) {
      const result = progress.completeLesson(lessonId, clock.nowMs());
      if (!result.didComplete) return;
      emitLessonCompleted(lessonId, result.durationMs, emitFn);
    },
    completeCourse(emitFn) {
      const current = progress.getState();
      if (current.activeLessonId) {
        const lessonResult = progress.completeLesson(current.activeLessonId, clock.nowMs());
        if (lessonResult.didComplete) {
          emitLessonCompleted(current.activeLessonId, lessonResult.durationMs, emitFn);
        }
      }
      const result = progress.completeCourse();
      if (!result.didComplete) return;
      emitFn("course_completed");
    },
    track,
    resetForCourseChange(nextCourseId) {
      configSnapshot.courseId = nextCourseId;
      courseId = nextCourseId;
      progress = createProgressController();
    },
  };
}

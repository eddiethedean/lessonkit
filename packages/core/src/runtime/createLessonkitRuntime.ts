import type { CourseId, LessonId } from "../identityTypes";
import type { TelemetryEvent, TelemetryEventName, TelemetryUser } from "../telemetryTypes";
import type {
  AssessmentScoreInput,
  AssessmentScoreResult,
  LessonkitPlugin,
  PluginHost,
  PluginRegistry,
} from "../plugins/types";
import { buildPluginContext } from "../plugins/context";
import { createPluginRegistry } from "../plugins/registry";
import { createDefaultClock, createSessionStoragePort, type ClockPort, type StoragePort } from "../ports";
import { createProgressController, type ProgressController, type ProgressState } from "../progress";
import { resolveSessionId } from "../session";
import { tryBuildTelemetryEvent } from "../telemetryBuilder";
import type { TelemetryDataFor } from "../telemetryTypes";
import {
  completeCourseWithTelemetry,
  completeLessonWithTelemetry,
} from "./courseLifecycle";

export type LessonkitRuntimeVersion = "v1" | "v2";

export type HeadlessLessonkitPlugins = readonly LessonkitPlugin[] | PluginRegistry | null | undefined;

export type HeadlessLessonkitConfig = {
  courseId: CourseId;
  runtimeVersion?: LessonkitRuntimeVersion;
  session?: {
    sessionId?: string;
    attemptId?: string;
    user?: TelemetryUser;
  };
  /** Plugin list or registry; hooks run on {@link HeadlessLessonkitRuntime.track} and lifecycle emits. */
  plugins?: HeadlessLessonkitPlugins;
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
  readonly pluginHost: PluginHost | null;
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
  scoreAssessment: (input: AssessmentScoreInput, lessonId?: LessonId) => AssessmentScoreResult | null;
  resetForCourseChange: (courseId: CourseId) => void;
  dispose: () => void;
};

function resolvePluginHost(plugins: HeadlessLessonkitPlugins): PluginHost | null {
  if (!plugins) return null;
  if (typeof plugins === "object" && "runTelemetry" in plugins) return plugins;
  if (Array.isArray(plugins) && plugins.length > 0) return createPluginRegistry(plugins);
  return null;
}

function warnRuntimeV1Deprecated(): void {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  if (typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "production") return;
  console.warn(
    '[lessonkit] runtimeVersion "v1" is deprecated; use "v2" (default). v1 will be removed in LessonKit 2.0.',
  );
}

export function createLessonkitRuntime(
  config: HeadlessLessonkitConfig,
  ports: HeadlessRuntimePorts = {},
): HeadlessLessonkitRuntime {
  if (config.runtimeVersion === "v1") warnRuntimeV1Deprecated();

  const storage = ports.storage ?? createSessionStoragePort();
  const clock = ports.clock ?? createDefaultClock();

  const configSnapshot: HeadlessLessonkitConfig = { ...config };

  let sessionId = resolveSessionId(storage, configSnapshot.session?.sessionId);
  let attemptId = configSnapshot.session?.attemptId;
  let user = configSnapshot.session?.user;
  let courseId = configSnapshot.courseId;

  let progress = createProgressController();
  let pluginHost = resolvePluginHost(configSnapshot.plugins);

  const getPluginCtx = () =>
    buildPluginContext({
      courseId,
      sessionId,
      attemptId,
      user,
    });

  const getSession = () => ({ sessionId, attemptId, user });

  const syncSessionFromConfig = (next: HeadlessLessonkitConfig) => {
    sessionId = resolveSessionId(storage, next.session?.sessionId);
    attemptId = next.session?.attemptId;
    user = next.session?.user;
    courseId = next.courseId;
  };

  const applyPluginsToEvent = (event: TelemetryEvent): TelemetryEvent | null => {
    if (!pluginHost) return event;
    return pluginHost.runTelemetry(event, getPluginCtx());
  };

  const buildAndApply = <N extends TelemetryEventName>(
    name: N,
    data: TelemetryDataFor<N> | undefined,
    lessonId?: LessonId,
  ): TelemetryEvent | null => {
    const event = tryBuildTelemetryEvent({
      name,
      courseId,
      lessonId: lessonId ?? progress.getState().activeLessonId,
      sessionId,
      attemptId,
      user,
      data,
    } as Parameters<typeof tryBuildTelemetryEvent>[0]);
    if (!event) return null;
    return applyPluginsToEvent(event);
  };

  const wrapEmitFn = (emitFn: TelemetryEmitFn): TelemetryEmitFn => {
    return (name, data, lessonId) => {
      const event = buildAndApply(name, data, lessonId);
      if (event === null) return;
      const eventLessonId = "lessonId" in event ? event.lessonId : lessonId;
      const eventData = "data" in event ? event.data : data;
      emitFn(event.name as typeof name, eventData as TelemetryDataFor<typeof name>, eventLessonId);
    };
  };

  syncSessionFromConfig(configSnapshot);

  const track = <N extends TelemetryEventName>(
    name: N,
    data: TelemetryDataFor<N> | undefined,
    emit: (event: TelemetryEvent) => void,
    lessonId?: LessonId,
  ) => {
    const event = buildAndApply(name, data, lessonId);
    if (!event) return;
    emit(event);
  };

  const emitLessonCompletedEvents = (
    lessonId: LessonId,
    durationMs: number | undefined,
    emitFn: TelemetryEmitFn,
  ) => {
    const wrapped = wrapEmitFn(emitFn);
    wrapped("lesson_completed", { lessonId, durationMs }, lessonId);
    if (durationMs !== undefined) {
      wrapped("lesson_time_on_task", { lessonId, durationMs }, lessonId);
    }
  };

  return {
    get config() {
      return configSnapshot;
    },
    get progress() {
      return progress;
    },
    get pluginHost() {
      return pluginHost;
    },
    getProgressState: () => progress.getState(),
    getSession,
    updateConfig(next) {
      if (next.plugins !== undefined && next.plugins !== pluginHost) {
        pluginHost?.disposeAll();
        configSnapshot.plugins = next.plugins;
        pluginHost = resolvePluginHost(configSnapshot.plugins);
      }
      if (next.courseId !== undefined) configSnapshot.courseId = next.courseId;
      if (next.runtimeVersion !== undefined) {
        if (next.runtimeVersion === "v1") warnRuntimeV1Deprecated();
        configSnapshot.runtimeVersion = next.runtimeVersion;
      }
      if (next.session !== undefined) {
        configSnapshot.session = { ...configSnapshot.session, ...next.session };
      }
      syncSessionFromConfig(configSnapshot);
    },
    setActiveLesson(lessonId, emitFn) {
      const wrapped = wrapEmitFn(emitFn);
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
          emitLessonCompletedEvents(previous, completed.durationMs, wrapped);
        }
      }

      progress.setActiveLesson(lessonId, clock.nowMs());
      wrapped("lesson_started", { lessonId }, lessonId);
    },
    completeLesson(lessonId, emitFn) {
      completeLessonWithTelemetry({
        progress,
        lessonId,
        nowMs: clock.nowMs(),
        emitLessonCompleted: (id, durationMs) =>
          emitLessonCompletedEvents(id, durationMs, wrapEmitFn(emitFn)),
      });
    },
    completeCourse(emitFn) {
      completeCourseWithTelemetry({
        progress,
        nowMs: clock.nowMs(),
        emitLessonCompleted: (id, durationMs) =>
          emitLessonCompletedEvents(id, durationMs, wrapEmitFn(emitFn)),
        emitCourseCompleted: () => wrapEmitFn(emitFn)("course_completed"),
      });
    },
    track,
    scoreAssessment(input, _lessonId) {
      if (!pluginHost) return null;
      return pluginHost.scoreAssessment(input, getPluginCtx());
    },
    resetForCourseChange(nextCourseId) {
      configSnapshot.courseId = nextCourseId;
      courseId = nextCourseId;
      progress = createProgressController();
    },
    dispose() {
      pluginHost?.disposeAll();
    },
  };
}

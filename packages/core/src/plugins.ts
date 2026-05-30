import type { CourseId, TelemetryEvent, TelemetrySink } from "./telemetryTypes";

/** Plugin category — aligns with roadmap extension areas. */
export type LessonkitPluginKind =
  | "analytics"
  | "lms"
  | "assessment"
  | "interaction"
  | "ai";

export type LessonkitPluginContext = {
  courseId: CourseId;
  sessionId?: string;
  attemptId?: string;
};

export type AssessmentScoreInput = {
  checkId: string;
  lessonId?: string;
  response: unknown;
};

export type AssessmentScoreResult = {
  score: number;
  maxScore?: number;
  passed?: boolean;
  feedback?: string;
};

/** Metadata for custom interaction blocks (renderer wiring stays in app code until 1.0). */
export type InteractionBlockRegistration = {
  blockType: string;
  catalogVersion?: string;
  description?: string;
};

/**
 * Framework plugin contract (v1). Plugins are plain objects registered on `LessonkitProvider`.
 * Marketplace / dynamic loading are out of scope until Studio post-1.0.
 */
export type LessonkitPlugin = {
  id: string;
  version: string;
  kind: LessonkitPluginKind;
  name?: string;
  setup?: (ctx: LessonkitPluginContext) => void;
  dispose?: () => void;
  /**
   * Observe or filter telemetry before tracking/xAPI. Return `null` to drop the event.
   * Hooks run in registration order.
   */
  onTelemetry?: (event: TelemetryEvent, ctx: LessonkitPluginContext) => TelemetryEvent | null;
  /** Optional batch observer (analytics); receives events after per-event hooks. */
  onTelemetryBatch?: (events: TelemetryEvent[], ctx: LessonkitPluginContext) => void;
  /** Wrap the configured tracking sink (analytics plugins). First registered = innermost. */
  wrapTrackingSink?: (sink: TelemetrySink, ctx: LessonkitPluginContext) => TelemetrySink;
  /** Optional assessment scoring override (assessment plugins). */
  scoreAssessment?: (
    input: AssessmentScoreInput,
    ctx: LessonkitPluginContext,
  ) => AssessmentScoreResult | null;
  /** Declare custom interaction block types for generators/tooling. */
  interactionBlocks?: InteractionBlockRegistration[];
};

export type PluginHost = {
  readonly plugins: readonly LessonkitPlugin[];
  setupAll: (ctx: LessonkitPluginContext) => void;
  disposeAll: () => void;
  runTelemetry: (event: TelemetryEvent, ctx: LessonkitPluginContext) => TelemetryEvent | null;
  runTelemetryBatch: (events: TelemetryEvent[], ctx: LessonkitPluginContext) => TelemetryEvent[];
  /** Invoke only `onTelemetryBatch` hooks; events were already filtered at emit time. */
  deliverTelemetryBatch: (events: TelemetryEvent[], ctx: LessonkitPluginContext) => TelemetryEvent[];
  composeTrackingSink: (
    sink: TelemetrySink | undefined,
    ctx: LessonkitPluginContext | (() => LessonkitPluginContext),
  ) => TelemetrySink | undefined;
  scoreAssessment: (
    input: AssessmentScoreInput,
    ctx: LessonkitPluginContext,
  ) => AssessmentScoreResult | null;
};

export function defineLessonkitPlugin(plugin: LessonkitPlugin): LessonkitPlugin {
  return plugin;
}

function warnDuplicatePlugin(id: string): void {
  const g = globalThis as typeof globalThis & { process?: { NODE_ENV?: string } };
  if (typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "production") return;
  console.warn(`[lessonkit] plugin id "${id}" was registered more than once; using the latest definition`);
}

export function createPluginHost(plugins: readonly LessonkitPlugin[] = []): PluginHost {
  const registry = new Map<string, LessonkitPlugin>();
  for (const plugin of plugins) {
    if (registry.has(plugin.id)) warnDuplicatePlugin(plugin.id);
    registry.set(plugin.id, plugin);
  }
  const list = [...registry.values()];

  const setupAll = (ctx: LessonkitPluginContext): void => {
    for (const plugin of list) {
      plugin.setup?.(ctx);
    }
  };

  const disposeAll = (): void => {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      list[i]?.dispose?.();
    }
  };

  const runTelemetry = (event: TelemetryEvent, ctx: LessonkitPluginContext): TelemetryEvent | null => {
    let current: TelemetryEvent | null = event;
    for (const plugin of list) {
      if (!plugin.onTelemetry || current === null) continue;
      current = plugin.onTelemetry(current, ctx);
    }
    return current;
  };

  const runTelemetryBatch = (events: TelemetryEvent[], ctx: LessonkitPluginContext): TelemetryEvent[] => {
    const filtered = events
      .map((event) => runTelemetry(event, ctx))
      .filter((event): event is TelemetryEvent => event !== null);
    for (const plugin of list) {
      plugin.onTelemetryBatch?.(filtered, ctx);
    }
    return filtered;
  };

  const deliverTelemetryBatch = (
    events: TelemetryEvent[],
    ctx: LessonkitPluginContext,
  ): TelemetryEvent[] => {
    for (const plugin of list) {
      plugin.onTelemetryBatch?.(events, ctx);
    }
    return events;
  };

  const composeTrackingSink = (
    sink: TelemetrySink | undefined,
    ctxSource: LessonkitPluginContext | (() => LessonkitPluginContext),
  ): TelemetrySink | undefined => {
    if (!sink) return undefined;

    const resolveCtx = (): LessonkitPluginContext =>
      typeof ctxSource === "function" ? ctxSource() : ctxSource;

    const ctxKey = (ctx: LessonkitPluginContext): string =>
      `${ctx.courseId}\0${ctx.sessionId ?? ""}\0${ctx.attemptId ?? ""}`;

    type Layer = {
      plugin: LessonkitPlugin;
      inner: TelemetrySink;
      wrapped: TelemetrySink | null;
      lastCtxKey: string;
    };

    const layers: Layer[] = [];
    let composed: TelemetrySink = sink;

    for (const plugin of list) {
      if (!plugin.wrapTrackingSink) continue;
      const inner = composed;
      const layer: Layer = { plugin, inner, wrapped: null, lastCtxKey: "" };
      layers.push(layer);
      composed = (event) => {
        const ctx = resolveCtx();
        const key = ctxKey(ctx);
        if (!layer.wrapped || layer.lastCtxKey !== key) {
          layer.wrapped = layer.plugin.wrapTrackingSink!(layer.inner, ctx) ?? layer.inner;
          layer.lastCtxKey = key;
        }
        return layer.wrapped(event);
      };
    }

    return composed;
  };

  const scoreAssessment = (
    input: AssessmentScoreInput,
    ctx: LessonkitPluginContext,
  ): AssessmentScoreResult | null => {
    for (const plugin of list) {
      if (plugin.kind !== "assessment" || !plugin.scoreAssessment) continue;
      const result = plugin.scoreAssessment(input, ctx);
      if (result) return result;
    }
    return null;
  };

  return {
    plugins: list,
    setupAll,
    disposeAll,
    runTelemetry,
    runTelemetryBatch,
    deliverTelemetryBatch,
    composeTrackingSink,
    scoreAssessment,
  };
}

import type { TelemetryEvent, TelemetrySink } from "../telemetryTypes";
import type {
  AssessmentScoreInput,
  AssessmentScoreResult,
  LessonkitPlugin,
  LessonkitPluginContext,
  PluginHost,
  PluginRegistry,
} from "./types";

function warnDuplicatePlugin(id: string): void {
  const g = globalThis as typeof globalThis & { process?: { NODE_ENV?: string } };
  if (typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "production") return;
  console.warn(`[lessonkit] plugin id "${id}" was registered more than once; using the latest definition`);
}

export function createPluginRegistry(plugins: readonly LessonkitPlugin[] = []): PluginRegistry {
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

/** @deprecated Use `createPluginRegistry`. */
export const createPluginHost = createPluginRegistry;

export type { PluginHost };

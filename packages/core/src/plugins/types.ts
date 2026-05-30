import type { CourseId, TelemetryEvent, TelemetrySink } from "../telemetryTypes";

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

export type PluginIdentity = {
  id: string;
  version: string;
  kind: LessonkitPluginKind;
  name?: string;
};

/** Narrow telemetry plugin contract (ISP). */
export type TelemetryPlugin = PluginIdentity & {
  onTelemetry?: (event: TelemetryEvent, ctx: LessonkitPluginContext) => TelemetryEvent | null;
  onTelemetryBatch?: (events: TelemetryEvent[], ctx: LessonkitPluginContext) => void;
  wrapTrackingSink?: (sink: TelemetrySink, ctx: LessonkitPluginContext) => TelemetrySink;
};

/** Narrow lifecycle plugin contract (ISP). */
export type LifecyclePlugin = PluginIdentity & {
  setup?: (ctx: LessonkitPluginContext) => void;
  dispose?: () => void;
};

/** Narrow assessment plugin contract (ISP). */
export type AssessmentPlugin = PluginIdentity & {
  kind: "assessment";
  scoreAssessment?: (
    input: AssessmentScoreInput,
    ctx: LessonkitPluginContext,
  ) => AssessmentScoreResult | null;
};

/** Narrow interaction metadata plugin (ISP). */
export type InteractionPlugin = PluginIdentity & {
  interactionBlocks?: InteractionBlockRegistration[];
};

/**
 * Combined plugin contract (v1). Prefer segregated types for new plugins.
 * @deprecated Prefer `TelemetryPlugin`, `AssessmentPlugin`, or `LifecyclePlugin` via `define*Plugin`.
 */
export type LessonkitPlugin = PluginIdentity &
  Partial<
    Pick<TelemetryPlugin, "onTelemetry" | "onTelemetryBatch" | "wrapTrackingSink"> &
      Pick<LifecyclePlugin, "setup" | "dispose"> &
      Pick<AssessmentPlugin, "scoreAssessment"> &
      Pick<InteractionPlugin, "interactionBlocks">
  >;

export type PluginHost = {
  readonly plugins: readonly LessonkitPlugin[];
  setupAll: (ctx: LessonkitPluginContext) => void;
  disposeAll: () => void;
  runTelemetry: (event: TelemetryEvent, ctx: LessonkitPluginContext) => TelemetryEvent | null;
  runTelemetryBatch: (events: TelemetryEvent[], ctx: LessonkitPluginContext) => TelemetryEvent[];
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

/** Segregated plugin registry (ISP + SRP). */
export type PluginRegistry = PluginHost;

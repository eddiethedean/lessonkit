import { isDevEnvironment } from "../runtime/validateComponentId";

/** Default compoundId when AssessmentSequence omits blockId — all instances share one key. */
export const DEFAULT_ASSESSMENT_SEQUENCE_COMPOUND_ID = "assessment-sequence";

export function warnSharedCompoundStorageKey(opts: {
  persistEnabled: boolean;
  hasExplicitBlockId: boolean;
  componentName: string;
}): void {
  if (!opts.persistEnabled || opts.hasExplicitBlockId || !isDevEnvironment()) return;
  console.warn(
    `[lessonkit] <${opts.componentName}> without blockId shares one sessionStorage key when persistCompoundState is enabled; set a unique blockId per instance.`,
  );
}

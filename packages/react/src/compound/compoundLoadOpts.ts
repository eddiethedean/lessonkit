import type { BlockId, LoadCompoundStateOptions } from "@lessonkit/core";
import type { LessonkitRuntime } from "../context";

export function compoundLoadOpts(
  ctx: LessonkitRuntime | null,
  compoundId: BlockId,
): LoadCompoundStateOptions | undefined {
  const onCorruptHook = ctx?.config?.observability?.onCompoundResumeCorrupt;
  if (!onCorruptHook) return undefined;
  return {
    onCorrupt: () => onCorruptHook({ compoundId, corrupt: true }),
    onDroppedChildKeys: (droppedChildKeys) =>
      onCorruptHook({ compoundId, droppedChildKeys }),
  };
}

import type { BlockId } from "@lessonkit/core";

export class MissingCompoundBlockIdError extends Error {
  constructor(componentName: string) {
    super(
      `[lessonkit] <${componentName}> requires a unique blockId when session.persistCompoundState is enabled`,
    );
    this.name = "MissingCompoundBlockIdError";
  }
}

export function requireCompoundBlockIdWhenPersisting(opts: {
  persistEnabled: boolean;
  blockId: BlockId | undefined;
  componentName: string;
}): void {
  if (opts.persistEnabled && !opts.blockId) {
    throw new MissingCompoundBlockIdError(opts.componentName);
  }
}

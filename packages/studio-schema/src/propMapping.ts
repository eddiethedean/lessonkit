import type { StudioBlockType } from "./blockRegistry";

/** Shared prop field contract for codegen emit and renderer adapters. */
export type StudioBlockPropMapping = {
  type: StudioBlockType;
  /** Prop names mapped to JSX/render prop keys (same logical field). */
  fields: Record<string, string>;
};

export const STUDIO_BLOCK_PROP_MAPPINGS: Partial<Record<StudioBlockType, StudioBlockPropMapping>> = {
  quiz: {
    type: "quiz",
    fields: {
      checkId: "checkId",
      question: "question",
      choices: "choices",
      answer: "answer",
    },
  },
  trueFalse: {
    type: "trueFalse",
    fields: {
      checkId: "checkId",
      question: "question",
      answer: "answer",
    },
  },
  fillInTheBlanks: {
    type: "fillInTheBlanks",
    fields: {
      checkId: "checkId",
      template: "template",
      blanks: "blanks",
    },
  },
};

export function getStudioBlockPropMapping(type: StudioBlockType): StudioBlockPropMapping | undefined {
  return STUDIO_BLOCK_PROP_MAPPINGS[type];
}

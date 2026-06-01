import type { LessonId } from "@lessonkit/core";
import type {
  StudioBlock,
  StudioProjectV1,
  StudioValidationIssue,
} from "@lessonkit/studio-schema";

/** Indices into nested `blocks` arrays; empty = page root. */
export type BlockParentPath = number[];

export type EditorSelection =
  | { kind: "none" }
  | { kind: "page"; pageId: LessonId }
  | { kind: "block"; pageId: LessonId; blockId: string; parentPath: BlockParentPath };

export type EditorCommand =
  | {
      type: "insertBlock";
      pageId: LessonId;
      parentPath: BlockParentPath;
      index: number;
      block: StudioBlock;
    }
  | { type: "deleteBlock"; pageId: LessonId; blockId: string }
  | {
      type: "moveBlock";
      pageId: LessonId;
      blockId: string;
      toParentPath: BlockParentPath;
      toIndex: number;
    }
  | {
      type: "updateBlockProps";
      pageId: LessonId;
      blockId: string;
      props: Record<string, unknown>;
    }
  | { type: "addPage"; title?: string; pageId?: LessonId }
  | { type: "deletePage"; pageId: LessonId }
  | { type: "renamePage"; pageId: LessonId; title: string }
  | { type: "reorderPage"; pageId: LessonId; toIndex: number }
  | { type: "setActivePage"; pageId: LessonId }
  | { type: "setSelection"; selection: EditorSelection };

export type DispatchResult =
  | { ok: true }
  | { ok: false; issues: StudioValidationIssue[] };

export type EditorState = {
  project: StudioProjectV1;
  selection: EditorSelection;
  activePageId: LessonId;
  validationIssues: StudioValidationIssue[];
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

export type BlockRef = {
  pageId: LessonId;
  parentPath: BlockParentPath;
  index: number;
  block: StudioBlock;
};

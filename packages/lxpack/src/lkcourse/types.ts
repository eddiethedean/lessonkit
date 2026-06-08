import type { LessonkitInterchangeV1 } from "@lxpack/validators";
import type { LessonkitManifest } from "../manifest";

export type LkcourseEnvelopeV1 = {
  format: "lkcourse";
  schemaVersion: 1;
  lessonkitVersion: string;
  exportedAt: string;
  sourceManifest: LessonkitManifest;
  entries: string[];
};

export type BlockTreeNodeV1 = {
  type: string;
  rawTag?: string;
  courseId?: string;
  lessonId?: string;
  checkId?: string;
  blockId?: string;
  nodeId?: string;
  children?: BlockTreeNodeV1[];
};

export type BlockTreeV1 = {
  schemaVersion: 1;
  sources: string[];
  blocks: BlockTreeNodeV1[];
};

export type LkcourseValidationIssue = {
  path: string;
  message: string;
};

export type ExportLkcourseOptions = {
  projectRoot: string;
  manifest: LessonkitManifest;
  outPath?: string;
  includeBlockTree?: boolean;
  lessonkitVersion?: string;
};

export type ExportLkcourseResult =
  | {
      ok: true;
      archivePath: string;
      fileCount: number;
      includeBlockTree: boolean;
    }
  | {
      ok: false;
      issues: LkcourseValidationIssue[];
    };

export type ValidateLkcourseResult =
  | {
      ok: true;
      envelope: LkcourseEnvelopeV1;
      interchange: LessonkitInterchangeV1;
    }
  | {
      ok: false;
      issues: LkcourseValidationIssue[];
    };

export type ImportLkcourseOptions = {
  archivePath: string;
  targetDir: string;
};

export type ImportLkcourseResult =
  | {
      ok: true;
      targetDir: string;
      manifest: LessonkitManifest;
      interchange: LessonkitInterchangeV1;
      fileCount: number;
    }
  | {
      ok: false;
      issues: LkcourseValidationIssue[];
    };

export type ExtractBlockTreeOptions = {
  projectRoot: string;
  blockTypes?: string[];
  appSources?: string[];
};

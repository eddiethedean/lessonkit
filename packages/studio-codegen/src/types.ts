import type { ExportTarget } from "@lessonkit/lxpack";
import type { ThemePresetName } from "@lessonkit/themes";
import type { StudioProjectV1, StudioValidationIssue } from "@lessonkit/studio-schema";

export type StudioExportMode = "renderer" | "jsx";

export type StudioExportPaths = {
  spaDistDir?: string;
  lxpackOutDir?: string;
  outputBaseDir?: string;
};

export type StudioExportOptions = {
  exportMode?: StudioExportMode;
  theme?: { preset?: ThemePresetName };
  tracking?: {
    xapi?: { activityIri?: string };
    completion?: { threshold?: number };
  };
  paths?: StudioExportPaths;
  /** Pin generated package.json dependency ranges (defaults to current monorepo versions). */
  lessonkitVersion?: string;
  studioVersion?: string;
  /** Copy relative asset files from this directory into generated `assets/`. */
  assetsDir?: string;
};

export type GeneratedFile = {
  path: string;
  content: string;
};

export type ExportValidationResult =
  | { ok: true; project: StudioProjectV1; warnings?: StudioValidationIssue[] }
  | { ok: false; issues: StudioValidationIssue[] };

export type PackageStudioOptions = StudioExportOptions & {
  outDir: string;
  target: ExportTarget;
  output?: string;
  dir?: boolean;
  projectRoot?: string;
};

import React, { useCallback, useMemo, useState } from "react";
import {
  assertExportableProject,
  generateExportFiles,
  type GeneratedFile,
  type StudioExportMode,
} from "@lessonkit/studio-codegen";
import type { ThemePresetName } from "@lessonkit/themes";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";

export type ExportPanelProps = {
  project: StudioProjectV1;
  className?: string;
  onDownloadZip?: (files: GeneratedFile[], slug: string) => void | Promise<void>;
};

const THEME_PRESETS: ThemePresetName[] = ["default", "light", "dark", "brand"];

function buildCliSnippet(courseId: string, exportMode: StudioExportMode): string {
  return [
    "# Node: write React/Vite tree, build, and package SCORM 1.2",
    "npm install @lessonkit/studio-codegen @lessonkit/studio-schema",
    `# then in a script: writeReactViteProject(project, { outDir: "./${courseId}", exportMode: "${exportMode}" })`,
    `cd ${courseId}`,
    "npm install && npm run build",
    "npx lessonkit package --target scorm12 --no-build",
  ].join("\n");
}

export function ExportPanel({ project, className, onDownloadZip }: ExportPanelProps) {
  const [exportMode, setExportMode] = useState<StudioExportMode>("renderer");
  const [themePreset, setThemePreset] = useState<ThemePresetName>("default");
  const [activityIri, setActivityIri] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const validation = useMemo(
    () => assertExportableProject(project),
    [project],
  );

  const exportOptions = useMemo(
    () => ({
      exportMode,
      theme: { preset: themePreset },
      tracking: activityIri.trim()
        ? { xapi: { activityIri: activityIri.trim() } }
        : undefined,
    }),
    [exportMode, themePreset, activityIri],
  );

  const cliSnippet = useMemo(
    () => buildCliSnippet(project.course.courseId, exportMode),
    [project.course.courseId, exportMode],
  );

  const handleDownload = useCallback(async () => {
    if (!validation.ok) {
      setMessage(validation.issues.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join("; "));
      return;
    }
    if (!onDownloadZip) {
      setMessage("Zip download is not configured for this host app.");
      return;
    }
    const files = generateExportFiles(validation.project, exportOptions);
    await onDownloadZip(files, project.course.courseId);
    setMessage("Download started.");
  }, [validation, onDownloadZip, exportOptions, project.course.courseId]);

  const handleCopyCli = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cliSnippet);
      setMessage("CLI commands copied.");
    } catch {
      setMessage("Could not copy to clipboard.");
    }
  }, [cliSnippet]);

  return (
    <div className={className ? `lk-studio-export ${className}` : "lk-studio-export"}>
      <fieldset className="lk-studio-export-fieldset" disabled={!validation.ok}>
        <legend>Export course</legend>
        <label className="lk-studio-export-label">
          Mode
          <select
            value={exportMode}
            onChange={(e) => setExportMode(e.target.value as StudioExportMode)}
          >
            <option value="renderer">Renderer (recommended)</option>
            <option value="jsx">Explicit JSX</option>
          </select>
        </label>
        <label className="lk-studio-export-label">
          Theme preset
          <select
            value={themePreset}
            onChange={(e) => setThemePreset(e.target.value as ThemePresetName)}
          >
            {THEME_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </label>
        <label className="lk-studio-export-label">
          xAPI activity IRI
          <input
            type="url"
            value={activityIri}
            placeholder={`https://lessonkit.app/courses/${project.course.courseId}`}
            onChange={(e) => setActivityIri(e.target.value)}
          />
        </label>
        <div className="lk-studio-export-actions">
          <button type="button" onClick={() => void handleDownload()}>
            Download React/Vite zip
          </button>
          <button type="button" onClick={() => void handleCopyCli()}>
            Copy CLI snippet
          </button>
        </div>
      </fieldset>
      {!validation.ok ? (
        <p className="lk-studio-export-error" role="alert">
          Fix validation issues before export:{" "}
          {validation.issues.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join("; ")}
        </p>
      ) : null}
      {message ? <p className="lk-studio-export-message">{message}</p> : null}
      <p className="lk-studio-export-hint">
        Browser export ships a React/Vite project. LMS packaging (SCORM, xAPI, cmi5) requires Node and{" "}
        <code>lessonkit package</code>.
      </p>
    </div>
  );
}

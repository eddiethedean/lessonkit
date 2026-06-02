import React, { useCallback, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import JSZip from "jszip";
import { loadStudioProject } from "@lessonkit/studio-schema";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import { ExportPanel, StudioEditor } from "@lessonkit/studio-ui";
import type { GeneratedFile } from "@lessonkit/studio-codegen";
import seedProject from "./project.json";
import pkg from "../package.json";

const STORAGE_KEY = "lessonkit-studio:project";

function loadInitialProject(): StudioProjectV1 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const loaded = loadStudioProject(parsed);
      if (loaded.ok) return loaded.project;
    } catch {
      /* use seed */
    }
  }
  const loaded = loadStudioProject(seedProject);
  if (!loaded.ok) throw new Error("Invalid seed project");
  return loaded.project;
}

async function downloadZip(files: GeneratedFile[], slug: string): Promise<void> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}-react-vite.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [project, setProject] = useState<StudioProjectV1>(() => loadInitialProject());

  const onProjectChange = useCallback((next: StudioProjectV1) => {
    setProject(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [project]);

  const importJson = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result)) as unknown;
          const loaded = loadStudioProject(parsed);
          if (!loaded.ok) {
            window.alert(loaded.issues.map((i) => `${i.path}: ${i.message}`).join("\n"));
            return;
          }
          onProjectChange(loaded.project);
        } catch {
          window.alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [onProjectChange]);

  const resetProject = useCallback(() => {
    const loaded = loadStudioProject(seedProject);
    if (loaded.ok) onProjectChange(loaded.project);
  }, [onProjectChange]);

  const editorKey = useMemo(() => project.course.courseId + project.pages.length, [project]);
  const studioVersion = (pkg as { studioVersion?: string }).studioVersion ?? "0.3.0";

  return (
    <div style={{ padding: "1rem", maxWidth: 1400, margin: "0 auto" }}>
      <header style={{ marginBottom: "1rem" }}>
        <h1 style={{ margin: "0 0 0.5rem" }}>LessonKit Studio</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>Local editor preview ({studioVersion})</p>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          <button type="button" onClick={exportJson}>
            Export JSON
          </button>
          <button type="button" onClick={importJson}>
            Import JSON
          </button>
          <button type="button" onClick={resetProject}>
            Reset sample
          </button>
        </div>
        <ExportPanel project={project} onDownloadZip={downloadZip} />
      </header>
      <StudioEditor key={editorKey} project={project} onProjectChange={onProjectChange} />
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");
createRoot(root).render(<App />);

import React, { useEffect, useRef } from "react";
import { ThemeProvider } from "@lessonkit/react";
import type { LessonkitConfig } from "@lessonkit/react";
import type { ThemePresetName } from "@lessonkit/themes";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import { createEditorStore, type EditorStoreState } from "@lessonkit/studio-builder";
import type { StoreApi } from "zustand/vanilla";
import { BlockPalette } from "./BlockPalette";
import { EditorCanvas } from "./EditorCanvas";
import { EditorDndShell } from "./EditorDndShell";
import { PageList } from "./PageList";
import { PreviewPanel } from "./PreviewPanel";
import { PropertyInspector } from "./PropertyInspector";
import { useEditorStore } from "./useEditorStore";
import "./styles.css";

export type StudioEditorProps = {
  project: StudioProjectV1;
  onProjectChange: (project: StudioProjectV1) => void;
  config?: Omit<LessonkitConfig, "courseId">;
  theme?: { preset?: ThemePresetName; mode?: "light" | "dark" };
  className?: string;
  autosaveDebounceMs?: number;
  store?: StoreApi<EditorStoreState>;
};

function ValidationBanner({ store }: { store: StoreApi<EditorStoreState> }) {
  const issues = useEditorStore(store, (s) => s.validationIssues);
  if (!issues.length) return null;
  return (
    <div className="lk-studio-validation" role="alert">
      <strong>Fix validation issues to save</strong>
      <ul>
        {issues.map((issue) => (
          <li key={`${issue.path}:${issue.message}`}>
            {issue.path}: {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Toolbar({ store }: { store: StoreApi<EditorStoreState> }) {
  const canUndo = useEditorStore(store, (s) => s.canUndo);
  const canRedo = useEditorStore(store, (s) => s.canRedo);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) store.getState().redo();
        else store.getState().undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [store]);

  return (
    <div className="lk-studio-toolbar">
      <button type="button" disabled={!canUndo} onClick={() => store.getState().undo()}>
        Undo
      </button>
      <button type="button" disabled={!canRedo} onClick={() => store.getState().redo()}>
        Redo
      </button>
    </div>
  );
}

export function StudioEditor({
  project,
  onProjectChange,
  config,
  theme,
  className,
  autosaveDebounceMs = 500,
  store: externalStore,
}: StudioEditorProps) {
  const storeRef = useRef<StoreApi<EditorStoreState>>(
    externalStore ?? createEditorStore(project),
  );
  const store = storeRef.current;
  const projectJson = JSON.stringify(project);

  useEffect(() => {
    if (externalStore) return;
    store.getState().replaceProject(project, { resetHistory: true });
  }, [projectJson, externalStore, store, project]);

  useEffect(() => {
    return store.getState().subscribeAutosave(onProjectChange, { debounceMs: autosaveDebounceMs });
  }, [store, onProjectChange, autosaveDebounceMs]);

  const preset = theme?.preset ?? "default";
  const mode = theme?.mode ?? "light";
  const activePageId = useEditorStore(store, (s) => s.activePageId);

  return (
    <ThemeProvider preset={preset} mode={mode}>
      <div className={className ? `lk-studio-editor ${className}` : "lk-studio-editor"}>
        <Toolbar store={store} />
        <ValidationBanner store={store} />
        <EditorDndShell store={store} activePageId={activePageId}>
          <aside className="lk-studio-sidebar">
            <PageList store={store} />
            <hr style={{ margin: "1rem 0", border: 0, borderTop: "1px solid #d0d4e4" }} />
            <BlockPalette store={store} />
          </aside>
          <section className="lk-studio-main">
            <EditorCanvas store={store} />
            <PreviewPanel store={store} config={config} theme={theme} />
          </section>
        </EditorDndShell>
        <aside className="lk-studio-inspector">
          <PropertyInspector store={store} />
        </aside>
      </div>
    </ThemeProvider>
  );
}

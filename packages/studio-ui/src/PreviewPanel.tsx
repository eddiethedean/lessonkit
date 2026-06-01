import { StudioRenderer } from "@lessonkit/studio-renderer";
import type { LessonkitConfig } from "@lessonkit/react";
import type { ThemePresetName } from "@lessonkit/themes";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import type { EditorStoreState } from "@lessonkit/studio-builder";
import type { StoreApi } from "zustand/vanilla";
import { useEditorStore } from "./useEditorStore";

type PreviewPanelProps = {
  store: StoreApi<EditorStoreState>;
  config?: Omit<LessonkitConfig, "courseId">;
  theme?: { preset?: ThemePresetName; mode?: "light" | "dark" };
};

export function PreviewPanel({ store, config, theme }: PreviewPanelProps) {
  const project = useEditorStore(store, (s) => s.project) as StudioProjectV1;
  const activePageId = useEditorStore(store, (s) => s.activePageId);

  return (
    <div className="lk-studio-preview" data-testid="studio-preview">
      <StudioRenderer
        project={project}
        config={config}
        theme={theme}
        activePageId={activePageId}
      />
    </div>
  );
}

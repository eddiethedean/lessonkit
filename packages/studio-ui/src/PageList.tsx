import type { EditorStoreState } from "@lessonkit/studio-builder";
import type { StoreApi } from "zustand/vanilla";
import { useEditorStore } from "./useEditorStore";

type PageListProps = {
  store: StoreApi<EditorStoreState>;
};

export function PageList({ store }: PageListProps) {
  const pages = useEditorStore(store, (s) => s.project.pages);
  const activePageId = useEditorStore(store, (s) => s.activePageId);

  return (
    <nav aria-label="Course pages">
      <h2 style={{ fontSize: "0.875rem", margin: "0 0 0.5rem" }}>Pages</h2>
      {pages.map((page) => (
        <button
          key={page.id}
          type="button"
          className={`lk-studio-page-item${page.id === activePageId ? " lk-studio-page-item--active" : ""}`}
          onClick={() => store.getState().dispatch({ type: "setActivePage", pageId: page.id })}
        >
          {page.title}
        </button>
      ))}
      <button
        type="button"
        className="lk-studio-palette-item"
        style={{ marginTop: "0.5rem" }}
        onClick={() => store.getState().dispatch({ type: "addPage" })}
      >
        + Add page
      </button>
    </nav>
  );
}

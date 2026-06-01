import type { ReactNode } from "react";
import type { StudioBlock } from "@lessonkit/studio-schema";
import { buildStudioBlockCatalog } from "@lessonkit/studio-schema";
import type { EditorStoreState } from "@lessonkit/studio-builder";
import { findBlockRef } from "@lessonkit/studio-builder";
import type { StoreApi } from "zustand/vanilla";
import { useEditorStore } from "./useEditorStore";

const catalog = buildStudioBlockCatalog();

type PropertyInspectorProps = {
  store: StoreApi<EditorStoreState>;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="lk-studio-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function BlockFields({
  block,
  pageId,
  store,
}: {
  block: StudioBlock;
  pageId: string;
  store: StoreApi<EditorStoreState>;
}) {
  const update = (props: Record<string, unknown>) => {
    store.getState().dispatch({
      type: "updateBlockProps",
      pageId,
      blockId: block.id,
      props,
    });
  };

  const entry = catalog.entries.find((e) => e.type === block.type);

  return (
    <>
      <Field label="id">
        <input value={block.id} readOnly />
      </Field>
      {entry?.props.map((prop) => {
        if (prop.name === "id") return null;
        const value = (block as Record<string, unknown>)[prop.name];
        if (prop.name === "choices" && block.type === "quiz") {
          return (
            <Field key={prop.name} label="choices (comma-separated)">
              <input
                value={Array.isArray(block.choices) ? block.choices.join(", ") : ""}
                onChange={(e) =>
                  update({
                    choices: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </Field>
          );
        }
        if (prop.name === "items" && block.type === "checklist") {
          return (
            <Field key={prop.name} label="items (one per line)">
              <textarea
                value={block.items.join("\n")}
                onChange={(e) =>
                  update({
                    items: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </Field>
          );
        }
        if (prop.name === "level" && block.type === "heading") {
          return (
            <Field key={prop.name} label="level">
              <select
                value={String(block.level)}
                onChange={(e) => update({ level: Number(e.target.value) as 1 | 2 | 3 })}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </Field>
          );
        }
        if (typeof value === "string" || typeof value === "number" || value === undefined) {
          return (
            <Field key={prop.name} label={prop.name}>
              <input
                value={value === undefined ? "" : String(value)}
                onChange={(e) => update({ [prop.name]: e.target.value })}
              />
            </Field>
          );
        }
        return null;
      })}
      <button
        type="button"
        className="lk-studio-palette-item"
        onClick={() =>
          store.getState().dispatch({ type: "deleteBlock", pageId, blockId: block.id })
        }
      >
        Delete block
      </button>
    </>
  );
}

export function PropertyInspector({ store }: PropertyInspectorProps) {
  const selection = useEditorStore(store, (s) => s.selection);
  const project = useEditorStore(store, (s) => s.project);

  if (selection.kind === "block") {
    const ref = findBlockRef(project, selection.pageId, selection.blockId);
    if (ref) {
      return (
        <div>
          <h2 style={{ fontSize: "0.875rem", margin: "0 0 0.5rem" }}>Properties</h2>
          <BlockFields block={ref.block} pageId={selection.pageId} store={store} />
        </div>
      );
    }
  }

  if (selection.kind === "page") {
    const page = project.pages.find((p) => p.id === selection.pageId);
    if (page) {
      return (
        <div>
          <h2 style={{ fontSize: "0.875rem", margin: "0 0 0.5rem" }}>Page</h2>
          <Field label="title">
            <input
              value={page.title}
              onChange={(e) =>
                store.getState().dispatch({
                  type: "renamePage",
                  pageId: page.id,
                  title: e.target.value,
                })
              }
            />
          </Field>
        </div>
      );
    }
  }

  return <p style={{ fontSize: "0.875rem" }}>Select a block or page to edit properties.</p>;
}

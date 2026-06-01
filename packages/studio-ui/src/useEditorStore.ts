import { useSyncExternalStore } from "react";
import type { EditorStoreState } from "@lessonkit/studio-builder";
import type { StoreApi } from "zustand/vanilla";

export function useEditorStore<T>(
  store: StoreApi<EditorStoreState>,
  selector: (state: EditorStoreState) => T,
): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()), () =>
    selector(store.getState()),
  );
}

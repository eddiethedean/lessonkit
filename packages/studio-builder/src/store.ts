import { createStore, type StoreApi } from "zustand/vanilla";
import type { LessonId } from "@lessonkit/core";
import type { StudioProjectV1, StudioValidationIssue } from "@lessonkit/studio-schema";
import { validateStudioProject } from "@lessonkit/studio-schema";
import {
  applyCommand,
  collectBlockIds,
  resolveActivePageAfterCommand,
  resolveSelectionAfterCommand,
} from "./applyCommand";
import { subscribeAutosave as bindAutosave, type AutosaveOptions, type AutosaveUnsubscribe } from "./autosave";
import type { DispatchResult, EditorCommand, EditorState } from "./types";

const MAX_HISTORY = 100;

export type EditorStoreState = EditorState & {
  dispatch: (command: EditorCommand) => DispatchResult;
  undo: () => void;
  redo: () => void;
  replaceProject: (project: StudioProjectV1, options?: { resetHistory?: boolean }) => void;
  collectBlockIds: () => Set<string>;
  subscribeAutosave: (
    onSave: (project: StudioProjectV1) => void,
    options?: AutosaveOptions,
  ) => AutosaveUnsubscribe;
};

type History = {
  past: StudioProjectV1[];
  future: StudioProjectV1[];
};

function validate(project: StudioProjectV1): StudioValidationIssue[] {
  const result = validateStudioProject(project);
  return result.ok ? [] : result.issues;
}

function initialActivePageId(project: StudioProjectV1): LessonId {
  /* v8 ignore next -- store is only created with valid projects (>= 1 page) */
  return project.pages[0]?.id ?? "";
}

function isHistoryCommand(command: EditorCommand): boolean {
  return command.type !== "setSelection" && command.type !== "setActivePage";
}

export function createEditorStore(initialProject: StudioProjectV1): StoreApi<EditorStoreState> {
  const history: History = { past: [], future: [] };
  let project = initialProject;

  const store: StoreApi<EditorStoreState> = createStore<EditorStoreState>((set, get) => {
    const sync = (nextProject: StudioProjectV1, patch: Partial<EditorState>) => {
      project = nextProject;
      const issues = validate(nextProject);
      set({
        project: nextProject,
        validationIssues: issues,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        ...patch,
      });
    };

    const pushHistory = (snapshot: StudioProjectV1) => {
      history.past.push(snapshot);
      if (history.past.length > MAX_HISTORY) history.past.shift();
      history.future = [];
    };

    return {
      project: initialProject,
      selection: { kind: "page", pageId: initialActivePageId(initialProject) },
      activePageId: initialActivePageId(initialProject),
      validationIssues: validate(initialProject),
      isDirty: false,
      canUndo: false,
      canRedo: false,

      dispatch: (command) => {
        if (command.type === "setSelection") {
          set({ selection: command.selection });
          return { ok: true };
        }

        if (command.type === "setActivePage") {
          set({ activePageId: command.pageId, selection: { kind: "page", pageId: command.pageId } });
          return { ok: true };
        }

        const before = project;
        const { project: applied } = applyCommand(before, command);
        const issues = validate(applied);
        if (issues.length > 0) {
          return { ok: false, issues };
        }

        /* v8 ignore start -- setSelection/setActivePage return before this */
        if (isHistoryCommand(command)) {
          pushHistory(before);
        }
        /* v8 ignore stop */

        const selection = resolveSelectionAfterCommand(applied, command, get().selection);
        const activePageId = resolveActivePageAfterCommand(applied, command, get().activePageId);

        sync(applied, {
          selection,
          activePageId,
          isDirty: true,
          canUndo: history.past.length > 0,
          canRedo: false,
        });
        return { ok: true };
      },

      undo: () => {
        const snapshot = history.past.pop();
        if (!snapshot) return;
        history.future.push(project);
        const activePageId = resolveActivePageAfterCommand(
          snapshot,
          { type: "setActivePage", pageId: get().activePageId },
          get().activePageId,
        );
        sync(snapshot, {
          activePageId,
          isDirty: true,
          canUndo: history.past.length > 0,
          canRedo: history.future.length > 0,
        });
      },

      redo: () => {
        const snapshot = history.future.pop();
        if (!snapshot) return;
        history.past.push(project);
        const activePageId = resolveActivePageAfterCommand(
          snapshot,
          { type: "setActivePage", pageId: get().activePageId },
          get().activePageId,
        );
        sync(snapshot, {
          activePageId,
          isDirty: true,
          canUndo: history.past.length > 0,
          canRedo: history.future.length > 0,
        });
      },

      replaceProject: (next, options) => {
        if (options?.resetHistory) {
          history.past = [];
          history.future = [];
        }
        sync(next, {
          activePageId: initialActivePageId(next),
          selection: { kind: "page", pageId: initialActivePageId(next) },
          isDirty: false,
          canUndo: history.past.length > 0,
          canRedo: history.future.length > 0,
        });
      },

      collectBlockIds: () => collectBlockIds(project),

      subscribeAutosave: (onSave, options): AutosaveUnsubscribe =>
        bindAutosave(
          store.subscribe,
          () => get().project,
          () => get().isDirty,
          (p) => {
            onSave(p);
            set({ isDirty: false });
          },
          options,
        ),
    };
  });

  return store;
}

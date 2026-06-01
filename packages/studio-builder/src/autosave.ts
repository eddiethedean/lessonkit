import type { StudioProjectV1 } from "@lessonkit/studio-schema";

export type AutosaveOptions = {
  debounceMs?: number;
};

export type AutosaveUnsubscribe = () => void;

export function subscribeAutosave(
  subscribe: (listener: () => void) => () => void,
  getProject: () => StudioProjectV1,
  isDirty: () => boolean,
  onSave: (project: StudioProjectV1) => void,
  options: AutosaveOptions = {},
): AutosaveUnsubscribe {
  const debounceMs = options.debounceMs ?? 500;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastSavedJson = JSON.stringify(getProject());

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (!isDirty()) return;
      const project = getProject();
      const json = JSON.stringify(project);
      if (json === lastSavedJson) return;
      lastSavedJson = json;
      onSave(project);
    }, debounceMs);
  };

  const unsub = subscribe(schedule);

  return () => {
    unsub();
    if (timer) clearTimeout(timer);
  };
}

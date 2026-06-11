import { useCallback, useState } from "react";

/** Select-item → activate-target interaction (keyboard and touch pick-and-place). */
export function usePickAndPlace<T>() {
  const [selected, setSelected] = useState<T | null>(null);

  const toggle = useCallback((item: T) => {
    setSelected((current) => (current === item ? null : item));
  }, []);

  const clear = useCallback(() => setSelected(null), []);

  const isSelected = useCallback((item: T) => selected === item, [selected]);

  return { selected, setSelected, toggle, clear, isSelected };
}

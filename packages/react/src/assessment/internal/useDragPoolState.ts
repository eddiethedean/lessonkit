import type React from "react";
import { useCallback, useState } from "react";

/** Shared drag pool + keyboard selection state for drag assessments. */
export function useDragPoolState(initialPool: string[]) {
  const [pool, setPool] = useState<string[]>(() => [...initialPool]);
  const [keyboardSelection, setKeyboardSelection] = useState<string | null>(null);

  const resetPool = useCallback((nextPool: string[]) => {
    setPool([...nextPool]);
    setKeyboardSelection(null);
  }, []);

  const moveToSlot = useCallback(
    (
      slotId: string,
      itemId: string,
      slots: Record<string, string>,
      setSlots: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    ) => {
      const prev = slots[slotId];
      setSlots((current) => ({ ...current, [slotId]: itemId }));
      setPool((p) => {
        const next = p.filter((id) => id !== itemId);
        if (prev) next.push(prev);
        return next;
      });
      setKeyboardSelection(null);
    },
    [],
  );

  return {
    pool,
    setPool,
    keyboardSelection,
    setKeyboardSelection,
    resetPool,
    moveToSlot,
  };
}

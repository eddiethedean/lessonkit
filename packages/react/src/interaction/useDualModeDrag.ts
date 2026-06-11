import { usePickAndPlace } from "./usePickAndPlace";
import { useCoarsePointer } from "./useCoarsePointer";
import { usePointerDrag, type UsePointerDragOptions } from "./usePointerDrag";

/** Coarse-pointer pick-and-place plus optional pointer drag (HTML5 drag disabled on coarse). */
export function useDualModeDrag<T>(pointerDragOptions: UsePointerDragOptions) {
  const coarsePointer = useCoarsePointer();
  const pickAndPlace = usePickAndPlace<T>();
  const pointerDrag = usePointerDrag(pointerDragOptions);

  return {
    coarsePointer,
    useHtmlDrag: !coarsePointer,
    pickAndPlace,
    pointerDrag,
    showTouchHint: coarsePointer,
  };
}

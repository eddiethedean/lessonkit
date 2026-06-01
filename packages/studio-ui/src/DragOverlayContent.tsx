export function DragOverlayContent({ activeDrag }: { activeDrag: string | null }) {
  if (!activeDrag) return null;
  return <div className="lk-studio-block-wrap lk-studio-block-wrap--selected">…</div>;
}

export function BlockLegend(props: { blocks: readonly string[] }) {
  if (!props.blocks.length) return null;

  return (
    <div className="showcase-block-legend" aria-label="Blocks in this lesson">
      {props.blocks.map((block) => (
        <span key={block} className="showcase-block-chip">
          {block}
        </span>
      ))}
    </div>
  );
}

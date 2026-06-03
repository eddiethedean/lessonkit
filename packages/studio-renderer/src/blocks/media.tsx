import React from "react";
import type { StudioChecklistBlock, StudioVideoBlock } from "@lessonkit/studio-schema";

const blockAttrs = (id: string) => ({
  "data-lk-studio-block": true,
  "data-lk-block-id": id,
});

export function ChecklistBlock({ block }: { block: StudioChecklistBlock }) {
  return (
    <section className="lk-studio-checklist" aria-label="Checklist" {...blockAttrs(block.id)}>
      <ul className="lk-studio-checklist-list">
        {block.items.map((item, i) => (
          <li key={`${block.id}-item-${i}`}>
            <label className="lk-studio-checklist-item">
              <input type="checkbox" disabled />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VideoBlock({ block }: { block: StudioVideoBlock }) {
  const title = block.title ?? "Video";
  return (
    <section className="lk-studio-video" aria-label={title} {...blockAttrs(block.id)}>
      {block.title ? <h3 className="lk-studio-video-title">{block.title}</h3> : null}
      <video className="lk-studio-video-player" controls preload="metadata" src={block.src}>
        <track kind="captions" />
      </video>
    </section>
  );
}

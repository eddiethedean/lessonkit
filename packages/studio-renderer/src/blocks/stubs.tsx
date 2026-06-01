import React, { useEffect } from "react";
import type { StudioChecklistBlock, StudioVideoBlock } from "@lessonkit-studio/schema";

function isDevEnvironment(): boolean {
  return typeof process !== "undefined" && process.env.NODE_ENV !== "production";
}

const blockAttrs = (id: string) => ({
  "data-lk-studio-block": true,
  "data-lk-block-id": id,
});

export function ChecklistBlock({ block }: { block: StudioChecklistBlock }) {
  useEffect(() => {
    /* v8 ignore next 4 -- dev-only placeholder warning */
    if (isDevEnvironment()) {
      console.warn(
        `[lessonkit-studio] checklist block "${block.id}" uses a placeholder renderer in 0.1.0`,
      );
    }
  }, [block.id]);

  return (
    <section
      className="lk-studio-stub lk-studio-checklist"
      aria-label="Checklist (preview stub)"
      {...blockAttrs(block.id)}
    >
      <p className="lk-studio-stub-label">Checklist (coming soon)</p>
      <ul>
        {block.items.map((item, i) => (
          <li key={`${block.id}-item-${i}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function VideoBlock({ block }: { block: StudioVideoBlock }) {
  useEffect(() => {
    /* v8 ignore next 4 -- dev-only placeholder warning */
    if (isDevEnvironment()) {
      console.warn(
        `[lessonkit-studio] video block "${block.id}" uses a placeholder renderer in 0.1.0`,
      );
    }
  }, [block.id]);

  return (
    <section
      className="lk-studio-stub lk-studio-video"
      aria-label={block.title ?? "Video (preview stub)"}
      {...blockAttrs(block.id)}
    >
      <p className="lk-studio-stub-label">Video (coming soon)</p>
      <p className="lk-studio-stub-src">{block.src}</p>
    </section>
  );
}

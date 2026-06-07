import React, { useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { resolveMediaSrc } from "./embedSecurity";

export type HotspotSpec = {
  id: string;
  label: string;
  x: number;
  y: number;
  content: React.ReactNode;
};

export type ImageHotspotsProps = {
  blockId: BlockId;
  src: string;
  alt: string;
  hotspots: HotspotSpec[];
};

export function ImageHotspots(props: ImageHotspotsProps) {
  const [active, setActive] = useState<string | null>(null);
  const { track, config } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const resolvedSrc = resolveMediaSrc(props.src, { allowedHosts: config.embed?.allowedHosts });

  const open = (hotspotId: string) => {
    setActive(hotspotId);
    track(
      "hotspot_opened",
      { blockId: props.blockId, hotspotId },
      lessonId ? { lessonId } : undefined,
    );
  };

  return (
    <section aria-label="Image hotspots" data-lk-block-id={props.blockId} data-testid="image-hotspots">
      <div style={{ position: "relative", display: "inline-block" }}>
        {resolvedSrc ? (
          <img src={resolvedSrc} alt={props.alt} style={{ maxWidth: "100%" }} />
        ) : (
          <p role="alert">This image URL is not allowed.</p>
        )}
        {props.hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-expanded={active === h.id}
            aria-label={h.label}
            data-testid={`hotspot-${h.id}`}
            style={{
              position: "absolute",
              left: `${h.x}%`,
              top: `${h.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => open(h.id)}
          >
            +
          </button>
        ))}
      </div>
      {active ? (
        <div role="dialog" aria-label="Hotspot details" data-testid="hotspot-popover">
          {props.hotspots.find((h) => h.id === active)?.content}
          <button type="button" onClick={() => setActive(null)}>
            Close
          </button>
        </div>
      ) : null}
    </section>
  );
}

setLessonkitBlockType(ImageHotspots, "ImageHotspots");

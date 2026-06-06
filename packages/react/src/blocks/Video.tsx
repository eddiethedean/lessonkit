import React from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";

export type VideoProps = {
  blockId: BlockId;
  src: string;
  poster?: string;
  /** WebVTT captions track URL. */
  captions?: string;
  title?: string;
};

export function Video(props: VideoProps) {
  return (
    <section aria-label={props.title ?? "Video"} data-lk-block-id={props.blockId} data-testid="video">
      {props.title ? <h3 data-testid="video-title">{props.title}</h3> : null}
      <video
        controls
        preload="metadata"
        poster={props.poster}
        src={props.src}
        data-testid="video-player"
        style={{ maxWidth: "100%" }}
      >
        {props.captions ? (
          <track kind="captions" src={props.captions} srcLang="en" label="Captions" default />
        ) : null}
      </video>
    </section>
  );
}

setLessonkitBlockType(Video, "Video");

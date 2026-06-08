import React, { useMemo } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { normalizeComponentId } from "../runtime/validateComponentId";
import { buildMediaOptions, resolveMediaSrc } from "./embedSecurity";

export type VideoProps = {
  blockId: BlockId;
  src: string;
  poster?: string;
  /** WebVTT captions track URL. */
  captions?: string;
  title?: string;
};

export function Video(props: VideoProps) {
  const { config } = useLessonkit();
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const mediaOptions = buildMediaOptions(config);
  const resolvedSrc = resolveMediaSrc(props.src, mediaOptions);
  const resolvedPoster = resolveMediaSrc(props.poster, mediaOptions);
  const resolvedCaptions = resolveMediaSrc(props.captions, mediaOptions);

  if (!resolvedSrc) {
    return (
      <section aria-label={props.title ?? "Video"} data-lk-block-id={blockId} data-testid="video">
        {props.title ? <h3 data-testid="video-title">{props.title}</h3> : null}
        <p role="alert" data-testid="video-blocked">
          This video URL is not allowed.
        </p>
      </section>
    );
  }

  return (
    <section aria-label={props.title ?? "Video"} data-lk-block-id={blockId} data-testid="video">
      {props.title ? <h3 data-testid="video-title">{props.title}</h3> : null}
      <video
        controls
        preload="metadata"
        poster={resolvedPoster ?? undefined}
        src={resolvedSrc}
        data-testid="video-player"
        style={{ maxWidth: "100%" }}
      >
        {resolvedCaptions ? (
          <track
            kind="captions"
            src={resolvedCaptions}
            srcLang="en"
            label="Captions"
            default
          />
        ) : null}
      </video>
    </section>
  );
}

setLessonkitBlockType(Video, "Video");

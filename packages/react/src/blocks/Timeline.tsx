import React, { useMemo } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";
import { buildMediaOptions, resolveMediaSrc } from "./embedSecurity";

export type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  body: string;
  mediaSrc?: string;
  mediaAlt?: string;
};

export type TimelineProps = {
  blockId: BlockId;
  events: TimelineEvent[];
};

export function Timeline(props: TimelineProps) {
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const { track, config } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const mediaOptions = buildMediaOptions(config);

  return (
    <section aria-label="Timeline" data-lk-block-id={blockId} data-testid="timeline-block">
      <ol>
        {props.events.map((event) => {
          const resolvedMedia = event.mediaSrc
            ? resolveMediaSrc(event.mediaSrc, mediaOptions)
            : null;
          return (
            <li
              key={event.id}
              data-testid={`timeline-event-${event.id}`}
              onFocus={() =>
                track(
                  "timeline_event_viewed",
                  { blockId, eventId: event.id },
                  lessonId ? { lessonId } : undefined,
                )
              }
            >
              <time dateTime={event.date}>{event.date}</time>
              <h4>{event.title}</h4>
              <p>{event.body}</p>
              {resolvedMedia && event.mediaAlt ? (
                <img src={resolvedMedia} alt={event.mediaAlt} style={{ maxWidth: "100%" }} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

setLessonkitBlockType(Timeline, "Timeline");

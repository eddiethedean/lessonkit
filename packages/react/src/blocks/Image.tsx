import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { resolveMediaSrc } from "./embedSecurity";

export type ImageProps = {
  blockId?: BlockId;
  src: string;
  alt: string;
};

export function Image(props: ImageProps) {
  const { config } = useLessonkit();
  const resolvedSrc = resolveMediaSrc(props.src, {
    allowedHosts: config.embed?.allowedHosts,
  });

  if (!resolvedSrc) {
    return (
      <figure
        data-lk-block-id={props.blockId}
        data-testid={props.blockId ? `image-${props.blockId}` : "image"}
      >
        <p role="alert">This image URL is not allowed.</p>
      </figure>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={props.alt}
      data-lk-block-id={props.blockId}
      data-testid={props.blockId ? `image-${props.blockId}` : "image"}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}

setLessonkitBlockType(Image, "Image");

import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";

export type ImageProps = {
  blockId?: BlockId;
  src: string;
  alt: string;
};

export function Image(props: ImageProps) {
  return (
    <img
      src={props.src}
      alt={props.alt}
      data-lk-block-id={props.blockId}
      data-testid={props.blockId ? `image-${props.blockId}` : "image"}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}

setLessonkitBlockType(Image, "Image");

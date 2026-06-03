import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";

export type HeadingProps = {
  blockId?: BlockId;
  level: 1 | 2 | 3;
  children: React.ReactNode;
};

export function Heading(props: HeadingProps) {
  const Tag = (`h${props.level}` as "h1" | "h2" | "h3");
  return (
    <Tag data-lk-block-id={props.blockId} data-testid={props.blockId ? `heading-${props.blockId}` : "heading"}>
      {props.children}
    </Tag>
  );
}

setLessonkitBlockType(Heading, "Heading");

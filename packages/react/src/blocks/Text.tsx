import React from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";

export type TextProps = {
  blockId?: BlockId;
  children: React.ReactNode;
};

export function Text(props: TextProps) {
  return (
    <p data-lk-block-id={props.blockId} data-testid={props.blockId ? `text-${props.blockId}` : "text"}>
      {props.children}
    </p>
  );
}

setLessonkitBlockType(Text, "Text");

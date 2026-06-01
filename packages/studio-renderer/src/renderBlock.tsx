import React from "react";
import { Quiz, Scenario } from "@lessonkit/react";
import type { StudioBlock } from "@lessonkit/studio-schema";
import {
  ButtonBlock,
  ContainerBlock,
  HeadingBlock,
  ImageBlock,
  InputBlock,
  TextBlock,
} from "./blocks/primitives";
import { ChecklistBlock, VideoBlock } from "./blocks/stubs";

export function renderBlock(block: StudioBlock): React.ReactNode {
  switch (block.type) {
    case "text":
      return <TextBlock block={block} />;
    case "heading":
      return <HeadingBlock block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    case "button":
      return <ButtonBlock block={block} />;
    case "input":
      return <InputBlock block={block} />;
    case "container":
      return (
        <ContainerBlock block={block}>
          {block.blocks.map((child) => (
            <React.Fragment key={child.id}>{renderBlock(child)}</React.Fragment>
          ))}
        </ContainerBlock>
      );
    case "quiz":
      return (
        <Quiz
          checkId={block.checkId}
          question={block.question}
          choices={block.choices}
          answer={block.answer}
        />
      );
    case "scenario":
      return (
        <Scenario blockId={block.blockId}>
          {block.blocks.map((child) => (
            <React.Fragment key={child.id}>{renderBlock(child)}</React.Fragment>
          ))}
        </Scenario>
      );
    case "checklist":
      return <ChecklistBlock block={block} />;
    case "video":
      return <VideoBlock block={block} />;
    /* v8 ignore start -- StudioBlock union exhaustiveness */
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
    /* v8 ignore stop */
  }
}

/** @internal Exported for tests — do not wrap with Course/Lesson. */
export function renderPageBlocks(blocks: StudioBlock[]): React.ReactNode {
  return blocks.map((block) => <React.Fragment key={block.id}>{renderBlock(block)}</React.Fragment>);
}

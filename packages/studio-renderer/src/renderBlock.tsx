import React from "react";
import {
  Accordion,
  AssessmentSequence,
  DialogCards,
  DragAndDrop,
  DragTheWords,
  FillInTheBlanks,
  FindHotspot,
  FindMultipleHotspots,
  Flashcards,
  Heading,
  Image,
  ImageHotspots,
  ImageSlider,
  InteractiveBook,
  MarkTheWords,
  Page,
  Quiz,
  Scenario,
  Text,
  TrueFalse,
} from "@lessonkit/react";
import type { StudioBlock } from "@lessonkit/studio-schema";
import { ButtonBlock, ContainerBlock, InputBlock } from "./blocks/primitives";
import { ChecklistBlock, VideoBlock } from "./blocks/media";

export function walkBlocks(blocks: StudioBlock[], visit: (block: StudioBlock) => void): void {
  for (const block of blocks) {
    visit(block);
    switch (block.type) {
      case "container":
      case "scenario":
        walkBlocks(block.blocks, visit);
        break;
      case "page":
        walkBlocks(block.blocks, visit);
        break;
      case "interactiveBook":
        for (const page of block.pages) {
          walkBlocks(page.blocks, visit);
        }
        break;
      case "assessmentSequence":
        walkBlocks(block.blocks, visit);
        break;
      case "accordion":
        for (const section of block.sections) {
          walkBlocks(section.blocks, visit);
        }
        break;
      case "imageHotspots":
        for (const hotspot of block.hotspots) {
          walkBlocks(hotspot.blocks, visit);
        }
        break;
      default:
        break;
    }
  }
}

function renderNestedBlocks(blocks: StudioBlock[]): React.ReactNode {
  return blocks.map((child) => (
    <React.Fragment key={child.id}>{renderBlock(child)}</React.Fragment>
  ));
}

export function renderBlock(block: StudioBlock): React.ReactNode {
  switch (block.type) {
    case "text":
      return <Text blockId={block.id}>{block.text}</Text>;
    case "heading":
      return (
        <Heading blockId={block.id} level={block.level}>
          {block.text}
        </Heading>
      );
    case "image":
      return <Image blockId={block.id} src={block.src} alt={block.alt} />;
    case "button":
      return <ButtonBlock block={block} />;
    case "input":
      return <InputBlock block={block} />;
    case "container":
      return (
        <ContainerBlock block={block}>
          {renderNestedBlocks(block.blocks)}
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
          {renderNestedBlocks(block.blocks)}
        </Scenario>
      );
    case "checklist":
      return <ChecklistBlock block={block} />;
    case "video":
      return <VideoBlock block={block} />;
    case "trueFalse":
      return (
        <TrueFalse checkId={block.checkId} question={block.question} answer={block.answer} />
      );
    case "fillInTheBlanks":
      return (
        <FillInTheBlanks
          checkId={block.checkId}
          template={block.template}
          blanks={block.blanks}
        />
      );
    case "markTheWords":
      return (
        <MarkTheWords
          checkId={block.checkId}
          text={block.text}
          correctWords={block.correctWords}
        />
      );
    case "dragTheWords":
      return (
        <DragTheWords
          checkId={block.checkId}
          template={block.template}
          words={block.words}
        />
      );
    case "dragAndDrop":
      return (
        <DragAndDrop
          checkId={block.checkId}
          items={block.items}
          targets={block.targets}
        />
      );
    case "page":
      return (
        <Page blockId={block.blockId} title={block.title}>
          {renderNestedBlocks(block.blocks)}
        </Page>
      );
    case "interactiveBook":
      return (
        <InteractiveBook
          blockId={block.blockId}
          title={block.title}
          showBookScore={block.showBookScore}
        >
          {block.pages.map((page) => (
            <Page key={page.id} blockId={page.blockId} title={page.title} hidden>
              {renderNestedBlocks(page.blocks)}
            </Page>
          ))}
        </InteractiveBook>
      );
    case "assessmentSequence":
      return (
        <AssessmentSequence blockId={block.blockId} sequential={block.sequential}>
          {renderNestedBlocks(block.blocks)}
        </AssessmentSequence>
      );
    case "accordion":
      return (
        <Accordion
          blockId={block.blockId}
          sections={block.sections.map((section) => ({
            id: section.id,
            title: section.title,
            content: renderNestedBlocks(section.blocks),
          }))}
        />
      );
    case "dialogCards":
      return <DialogCards blockId={block.blockId} cards={block.cards} />;
    case "flashcards":
      return (
        <Flashcards
          blockId={block.blockId}
          cards={block.cards}
          selfScore={block.selfScore}
        />
      );
    case "imageHotspots":
      return (
        <ImageHotspots
          blockId={block.blockId}
          src={block.src}
          alt={block.alt}
          hotspots={block.hotspots.map((hotspot) => ({
            id: hotspot.id,
            label: hotspot.label,
            x: hotspot.x,
            y: hotspot.y,
            content: renderNestedBlocks(hotspot.blocks),
          }))}
        />
      );
    case "imageSlider":
      return <ImageSlider blockId={block.blockId} slides={block.slides} />;
    case "findHotspot":
      return (
        <FindHotspot
          checkId={block.checkId}
          src={block.src}
          alt={block.alt}
          targets={block.targets}
          correctTargetId={block.correctTargetId}
        />
      );
    case "findMultipleHotspots":
      return (
        <FindMultipleHotspots
          checkId={block.checkId}
          src={block.src}
          alt={block.alt}
          targets={block.targets}
          correctTargetIds={block.correctTargetIds}
        />
      );
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

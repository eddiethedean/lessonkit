import type {
  StudioAccordionBlock,
  StudioBlock,
  StudioDialogCardsBlock,
  StudioDragAndDropBlock,
  StudioFillInTheBlanksBlock,
  StudioFindHotspotBlock,
  StudioFlashcardsBlock,
  StudioImageHotspotsBlock,
  StudioImageSliderBlock,
  StudioPageBlock,
  StudioProjectV1,
} from "@lessonkit/studio-schema";

type StudioAccordionSection = StudioAccordionBlock["sections"][number];
type StudioDialogCard = StudioDialogCardsBlock["cards"][number];
type StudioDragItem = StudioDragAndDropBlock["items"][number];
type StudioDropTarget = StudioDragAndDropBlock["targets"][number];
type StudioFillInBlankSpec = NonNullable<StudioFillInTheBlanksBlock["blanks"]>[number];
type StudioFlashcard = StudioFlashcardsBlock["cards"][number];
type StudioHotspotSpec = StudioImageHotspotsBlock["hotspots"][number];
type StudioHotspotTarget = StudioFindHotspotBlock["targets"][number];
type StudioImageSlide = StudioImageSliderBlock["slides"][number];
import { jsxStringArray, jsxStringLiteral } from "./escapeJsx";

function jsxChildrenText(text: string, indent: string): string {
  return `\n${indent}  {${jsxStringLiteral(text)}}\n${indent}`;
}

function optionalBlockIdProp(blockId: string | undefined, indent: string): string {
  return blockId ? `\n${indent}  blockId=${jsxStringLiteral(blockId)}` : "";
}

function jsxBooleanProp(name: string, value: boolean | undefined, indent: string): string {
  if (value === undefined) return "";
  return value ? `\n${indent}  ${name}` : `\n${indent}  ${name}={false}`;
}

function emitObjectArray<T>(
  items: readonly T[],
  emitItem: (item: T) => string,
  indent: string,
): string {
  if (!items.length) return "[]";
  const lines = items.map((item) => `${indent}    ${emitItem(item)}`);
  return `[\n${lines.join(",\n")}\n${indent}  ]`;
}

function emitFillInBlankSpecs(blanks: StudioFillInBlankSpec[] | undefined, indent: string): string {
  if (!blanks?.length) return "";
  const body = emitObjectArray(
    blanks,
    (b) => `{ id: ${jsxStringLiteral(b.id)}, answer: ${jsxStringLiteral(b.answer)} }`,
    indent,
  );
  return `\n${indent}  blanks={${body}}`;
}

function emitDialogCards(cards: StudioDialogCard[], indent: string): string {
  return emitObjectArray(
    cards,
    (c) => `{ front: ${jsxStringLiteral(c.front)}, back: ${jsxStringLiteral(c.back)} }`,
    indent,
  );
}

function emitFlashcards(cards: StudioFlashcard[], indent: string): string {
  return emitObjectArray(
    cards,
    (c) => `{ front: ${jsxStringLiteral(c.front)}, back: ${jsxStringLiteral(c.back)} }`,
    indent,
  );
}

function emitHotspotTargets(targets: StudioHotspotTarget[], indent: string): string {
  return emitObjectArray(
    targets,
    (t) =>
      `{ id: ${jsxStringLiteral(t.id)}, label: ${jsxStringLiteral(t.label)}, x: ${t.x}, y: ${t.y} }`,
    indent,
  );
}

function emitDragItems(items: StudioDragItem[], indent: string): string {
  return emitObjectArray(
    items,
    (item) => `{ id: ${jsxStringLiteral(item.id)}, label: ${jsxStringLiteral(item.label)} }`,
    indent,
  );
}

function emitDropTargets(targets: StudioDropTarget[], indent: string): string {
  return emitObjectArray(
    targets,
    (target) =>
      `{ id: ${jsxStringLiteral(target.id)}, label: ${jsxStringLiteral(target.label)}, accepts: ${jsxStringLiteral(target.accepts)} }`,
    indent,
  );
}

function emitImageSlides(slides: StudioImageSlide[], indent: string): string {
  return emitObjectArray(slides, (slide) => {
    const caption = slide.caption ? `, caption: ${jsxStringLiteral(slide.caption)}` : "";
    return `{ src: ${jsxStringLiteral(slide.src)}, alt: ${jsxStringLiteral(slide.alt)}${caption} }`;
  }, indent);
}

function emitPageJsx(page: StudioPageBlock, indent: string, hidden: boolean): string {
  const titleProp = page.title ? `\n${indent}  title=${jsxStringLiteral(page.title)}` : "";
  const hiddenProp = hidden ? `\n${indent}  hidden` : "";
  const body = emitBlocksJsx(page.blocks, indent + "    ");
  return `${indent}<Page\n${indent}  blockId=${jsxStringLiteral(page.blockId)}${titleProp}${hiddenProp}\n${indent}>\n${body}\n${indent}</Page>`;
}

function emitAccordionSections(sections: StudioAccordionSection[], indent: string): string {
  const sectionLines = sections.map((section) => {
    const content = emitBlocksJsx(section.blocks, indent + "        ");
    return `${indent}      {\n${indent}        id: ${jsxStringLiteral(section.id)},\n${indent}        title: ${jsxStringLiteral(section.title)},\n${indent}        content: (\n${indent}          <>\n${content}\n${indent}          </>\n${indent}        ),\n${indent}      }`;
  });
  return `[\n${sectionLines.join(",\n")}\n${indent}    ]`;
}

function emitImageHotspots(hotspots: StudioHotspotSpec[], indent: string): string {
  const hotspotLines = hotspots.map((hotspot) => {
    const content = emitBlocksJsx(hotspot.blocks, indent + "          ");
    return `${indent}        {\n${indent}          id: ${jsxStringLiteral(hotspot.id)},\n${indent}          label: ${jsxStringLiteral(hotspot.label)},\n${indent}          x: ${hotspot.x},\n${indent}          y: ${hotspot.y},\n${indent}          content: (\n${indent}            <>\n${content}\n${indent}            </>\n${indent}          ),\n${indent}        }`;
  });
  return `[\n${hotspotLines.join(",\n")}\n${indent}      ]`;
}

export function emitBlockJsx(block: StudioBlock, indent: string): string {
  switch (block.type) {
    case "text":
      return `${indent}<Text${optionalBlockIdProp(block.id, indent)}>${jsxChildrenText(block.text, indent)}</Text>`;
    case "heading": {
      const blockId = optionalBlockIdProp(block.id, indent);
      return `${indent}<Heading\n${indent}  level={${block.level}}${blockId}\n${indent}>${jsxChildrenText(block.text, indent)}</Heading>`;
    }
    case "image":
      return `${indent}<Image\n${indent}  src=${jsxStringLiteral(block.src)}\n${indent}  alt=${jsxStringLiteral(block.alt)}${optionalBlockIdProp(block.id, indent)}\n${indent}/>`;
    case "button": {
      if (block.href) {
        return `${indent}<a className="lk-studio-button" href=${jsxStringLiteral(block.href)}>${escapeHtmlText(block.label)}</a>`;
      }
      return `${indent}<button type="button" className="lk-studio-button">${escapeHtmlText(block.label)}</button>`;
    }
    case "input": {
      const inputId = `lk-studio-input-${block.id}`;
      const placeholder = block.placeholder
        ? ` placeholder=${jsxStringLiteral(block.placeholder)}`
        : "";
      return `${indent}<div className="lk-studio-input">\n${indent}  <label htmlFor=${jsxStringLiteral(inputId)}>${escapeHtmlText(block.label)}</label>\n${indent}  <input id=${jsxStringLiteral(inputId)} type=${jsxStringLiteral(block.inputType ?? "text")} name=${jsxStringLiteral(block.id)}${placeholder} />\n${indent}</div>`;
    }
    case "container":
      return `${indent}<div className="lk-studio-container">\n${emitBlocksJsx(block.blocks, indent + "  ")}\n${indent}</div>`;
    case "quiz":
      return `${indent}<Quiz\n${indent}  checkId=${jsxStringLiteral(block.checkId)}\n${indent}  question=${jsxStringLiteral(block.question)}\n${indent}  choices={${jsxStringArray(block.choices)}}\n${indent}  answer=${jsxStringLiteral(block.answer)}\n${indent}/>`;
    case "scenario": {
      const blockId = block.blockId ? `\n${indent}  blockId=${jsxStringLiteral(block.blockId)}` : "";
      return `${indent}<Scenario${blockId}>\n${emitBlocksJsx(block.blocks, indent + "  ")}\n${indent}</Scenario>`;
    }
    case "checklist":
      return `${indent}<section className="lk-studio-checklist" aria-label="Checklist">\n${indent}  <ul className="lk-studio-checklist-list">\n${block.items.map((item) => `${indent}    <li><label className="lk-studio-checklist-item"><input type="checkbox" disabled readOnly /><span>${escapeHtmlText(item)}</span></label></li>`).join("\n")}\n${indent}  </ul>\n${indent}</section>`;
    case "video": {
      const titleAttr = block.title ? ` aria-label=${jsxStringLiteral(block.title)}` : ` aria-label="Video"`;
      const titleHeading = block.title
        ? `\n${indent}  <h3 className="lk-studio-video-title">${escapeHtmlText(block.title)}</h3>`
        : "";
      return `${indent}<section className="lk-studio-video"${titleAttr}>${titleHeading}\n${indent}  <video className="lk-studio-video-player" controls preload="metadata" src=${jsxStringLiteral(block.src)}>\n${indent}    <track kind="captions" />\n${indent}  </video>\n${indent}</section>`;
    }
    case "trueFalse":
      return `${indent}<TrueFalse\n${indent}  checkId=${jsxStringLiteral(block.checkId)}\n${indent}  question=${jsxStringLiteral(block.question)}\n${indent}  answer={${block.answer}}\n${indent}/>`;
    case "fillInTheBlanks":
      return `${indent}<FillInTheBlanks\n${indent}  checkId=${jsxStringLiteral(block.checkId)}\n${indent}  template=${jsxStringLiteral(block.template)}${emitFillInBlankSpecs(block.blanks, indent)}\n${indent}/>`;
    case "markTheWords":
      return `${indent}<MarkTheWords\n${indent}  checkId=${jsxStringLiteral(block.checkId)}\n${indent}  text=${jsxStringLiteral(block.text)}\n${indent}  correctWords={${jsxStringArray(block.correctWords)}}\n${indent}/>`;
    case "dragTheWords":
      return `${indent}<DragTheWords\n${indent}  checkId=${jsxStringLiteral(block.checkId)}\n${indent}  template=${jsxStringLiteral(block.template)}\n${indent}  words={${jsxStringArray(block.words)}}\n${indent}/>`;
    case "dragAndDrop":
      return `${indent}<DragAndDrop\n${indent}  checkId=${jsxStringLiteral(block.checkId)}\n${indent}  items={${emitDragItems(block.items, indent)}}\n${indent}  targets={${emitDropTargets(block.targets, indent)}}\n${indent}/>`;
    case "page":
      return emitPageJsx(block, indent, false);
    case "interactiveBook": {
      const showBookScore = jsxBooleanProp("showBookScore", block.showBookScore, indent);
      const pages = block.pages.map((page) => emitPageJsx(page, indent + "    ", true)).join("\n");
      return `${indent}<InteractiveBook\n${indent}  blockId=${jsxStringLiteral(block.blockId)}\n${indent}  title=${jsxStringLiteral(block.title)}${showBookScore}\n${indent}>\n${pages}\n${indent}</InteractiveBook>`;
    }
    case "assessmentSequence": {
      const blockId = block.blockId ? `\n${indent}  blockId=${jsxStringLiteral(block.blockId)}` : "";
      const sequential = jsxBooleanProp("sequential", block.sequential, indent);
      return `${indent}<AssessmentSequence${blockId}${sequential}>\n${emitBlocksJsx(block.blocks, indent + "  ")}\n${indent}</AssessmentSequence>`;
    }
    case "accordion":
      return `${indent}<Accordion\n${indent}  blockId=${jsxStringLiteral(block.blockId)}\n${indent}  sections={${emitAccordionSections(block.sections, indent)}}\n${indent}/>`;
    case "dialogCards":
      return `${indent}<DialogCards\n${indent}  blockId=${jsxStringLiteral(block.blockId)}\n${indent}  cards={${emitDialogCards(block.cards, indent)}}\n${indent}/>`;
    case "flashcards": {
      const selfScore = jsxBooleanProp("selfScore", block.selfScore, indent);
      return `${indent}<Flashcards\n${indent}  blockId=${jsxStringLiteral(block.blockId)}\n${indent}  cards={${emitFlashcards(block.cards, indent)}}${selfScore}\n${indent}/>`;
    }
    case "imageHotspots":
      return `${indent}<ImageHotspots\n${indent}  blockId=${jsxStringLiteral(block.blockId)}\n${indent}  src=${jsxStringLiteral(block.src)}\n${indent}  alt=${jsxStringLiteral(block.alt)}\n${indent}  hotspots={${emitImageHotspots(block.hotspots, indent)}}\n${indent}/>`;
    case "imageSlider":
      return `${indent}<ImageSlider\n${indent}  blockId=${jsxStringLiteral(block.blockId)}\n${indent}  slides={${emitImageSlides(block.slides, indent)}}\n${indent}/>`;
    case "findHotspot":
      return `${indent}<FindHotspot\n${indent}  checkId=${jsxStringLiteral(block.checkId)}\n${indent}  src=${jsxStringLiteral(block.src)}\n${indent}  alt=${jsxStringLiteral(block.alt)}\n${indent}  targets={${emitHotspotTargets(block.targets, indent)}}\n${indent}  correctTargetId=${jsxStringLiteral(block.correctTargetId)}\n${indent}/>`;
    case "findMultipleHotspots":
      return `${indent}<FindMultipleHotspots\n${indent}  checkId=${jsxStringLiteral(block.checkId)}\n${indent}  src=${jsxStringLiteral(block.src)}\n${indent}  alt=${jsxStringLiteral(block.alt)}\n${indent}  targets={${emitHotspotTargets(block.targets, indent)}}\n${indent}  correctTargetIds={${jsxStringArray(block.correctTargetIds)}}\n${indent}/>`;
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

export function emitBlocksJsx(blocks: StudioBlock[], indent: string): string {
  return blocks.map((block) => emitBlockJsx(block, indent)).join("\n");
}

const REACT_BLOCK_IMPORTS = [
  "Accordion",
  "AssessmentSequence",
  "Course",
  "DialogCards",
  "DragAndDrop",
  "DragTheWords",
  "FillInTheBlanks",
  "FindHotspot",
  "FindMultipleHotspots",
  "Flashcards",
  "Heading",
  "Image",
  "ImageHotspots",
  "ImageSlider",
  "InteractiveBook",
  "Lesson",
  "MarkTheWords",
  "Page",
  "Quiz",
  "Scenario",
  "Text",
  "ThemeProvider",
  "TrueFalse",
].join(", ");

export function emitAppTsx(project: StudioProjectV1, themePreset: string): string {
  const lessons = project.pages
    .map((page) => {
      const body = emitBlocksJsx(page.blocks, "          ");
      return `        <Lesson title=${jsxStringLiteral(page.title)} lessonId=${jsxStringLiteral(page.id)}>\n${body}\n        </Lesson>`;
    })
    .join("\n");

  return `import React from "react";
import { ${REACT_BLOCK_IMPORTS} } from "@lessonkit/react";
import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIStatement } from "@lessonkit/xapi";

const courseConfig = {
  tracking: {
    sink: (event: TelemetryEvent) => {
      console.log("[telemetry]", event);
    },
  },
  xapi: {
    enabled: true,
    transport: (statement: XAPIStatement) => {
      console.log("[xapi]", statement);
    },
  },
} as const;

export default function App() {
  return (
    <ThemeProvider preset=${jsxStringLiteral(themePreset)} mode="light">
      <div className="app-shell">
        <Course title=${jsxStringLiteral(project.course.title)} courseId=${jsxStringLiteral(project.course.courseId)} config={courseConfig}>
${lessons}
        </Course>
      </div>
    </ThemeProvider>
  );
}
`;
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

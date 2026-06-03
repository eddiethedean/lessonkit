import type {
  StudioAccordionSection,
  StudioBlock,
  StudioDialogCard,
  StudioDragItem,
  StudioDropTarget,
  StudioFillInBlankSpec,
  StudioFlashcard,
  StudioHotspotSpec,
  StudioHotspotTarget,
  StudioImageSlide,
  StudioPage,
  StudioPageBlock,
  StudioProjectV1,
  ParseStudioProjectResult,
  StudioValidationIssue,
} from "./types";
import { studioSchemaVersion } from "./types";
import { isRecord, parsePositiveInt, parseString, pushIssue } from "./parseUtils";

const BLOCK_TYPES = [
  "text",
  "heading",
  "image",
  "button",
  "input",
  "container",
  "quiz",
  "scenario",
  "checklist",
  "video",
  "trueFalse",
  "fillInTheBlanks",
  "markTheWords",
  "dragTheWords",
  "dragAndDrop",
  "page",
  "interactiveBook",
  "assessmentSequence",
  "accordion",
  "dialogCards",
  "flashcards",
  "imageHotspots",
  "imageSlider",
  "findHotspot",
  "findMultipleHotspots",
] as const;

function parseBoolean(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): boolean | undefined {
  if (typeof raw === "boolean") return raw;
  if (raw === "true") return true;
  if (raw === "false") return false;
  pushIssue(issues, path, "must be a boolean");
  return undefined;
}

function parseNumber(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  pushIssue(issues, path, "must be a number");
  return undefined;
}

function parseStringArray(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
  { minLength = 1 }: { minLength?: number } = {},
): string[] | undefined {
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array of strings");
    return undefined;
  }
  const values = raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  if (values.length < minLength) {
    pushIssue(issues, path, `must contain at least ${minLength} string(s)`);
    return undefined;
  }
  return values;
}

function parseAccordionSections(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioAccordionSection[] {
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array");
    return [];
  }
  const sections: StudioAccordionSection[] = [];
  raw.forEach((item, index) => {
    const sectionPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      pushIssue(issues, sectionPath, "must be an object");
      return;
    }
    const id = parseString(item.id, `${sectionPath}.id`, issues);
    const title = parseString(item.title, `${sectionPath}.title`, issues);
    if (!id || !title) return;
    const blocks = parseBlocks(item.blocks, `${sectionPath}.blocks`, issues);
    sections.push({ id, title, blocks });
  });
  return sections;
}

function parsePageBlockItems(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioPageBlock[] {
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array");
    return [];
  }
  const pages: StudioPageBlock[] = [];
  raw.forEach((item, index) => {
    const block = parseBlock(item, `${path}[${index}]`, issues);
    if (block?.type === "page") pages.push(block);
    else if (block) {
      pushIssue(issues, `${path}[${index}].type`, 'must be "page"');
    }
  });
  return pages;
}

function parseFillInBlanks(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioFillInBlankSpec[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array");
    return undefined;
  }
  const blanks: StudioFillInBlankSpec[] = [];
  raw.forEach((item, index) => {
    const blankPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      pushIssue(issues, blankPath, "must be an object");
      return;
    }
    const id = parseString(item.id, `${blankPath}.id`, issues);
    const answer = parseString(item.answer, `${blankPath}.answer`, issues);
    if (id && answer) blanks.push({ id, answer });
  });
  return blanks.length ? blanks : undefined;
}

function parseDragItems(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioDragItem[] | undefined {
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array");
    return undefined;
  }
  const items: StudioDragItem[] = [];
  raw.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      pushIssue(issues, itemPath, "must be an object");
      return;
    }
    const id = parseString(item.id, `${itemPath}.id`, issues);
    const label = parseString(item.label, `${itemPath}.label`, issues);
    if (id && label) items.push({ id, label });
  });
  if (!items.length) {
    pushIssue(issues, path, "must contain at least one item");
    return undefined;
  }
  return items;
}

function parseDropTargets(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioDropTarget[] | undefined {
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array");
    return undefined;
  }
  const targets: StudioDropTarget[] = [];
  raw.forEach((item, index) => {
    const targetPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      pushIssue(issues, targetPath, "must be an object");
      return;
    }
    const id = parseString(item.id, `${targetPath}.id`, issues);
    const label = parseString(item.label, `${targetPath}.label`, issues);
    const accepts = parseString(item.accepts, `${targetPath}.accepts`, issues);
    if (id && label && accepts) targets.push({ id, label, accepts });
  });
  if (!targets.length) {
    pushIssue(issues, path, "must contain at least one target");
    return undefined;
  }
  return targets;
}

function parseHotspotTargets(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioHotspotTarget[] | undefined {
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array");
    return undefined;
  }
  const targets: StudioHotspotTarget[] = [];
  raw.forEach((item, index) => {
    const targetPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      pushIssue(issues, targetPath, "must be an object");
      return;
    }
    const id = parseString(item.id, `${targetPath}.id`, issues);
    const label = parseString(item.label, `${targetPath}.label`, issues);
    const x = parseNumber(item.x, `${targetPath}.x`, issues);
    const y = parseNumber(item.y, `${targetPath}.y`, issues);
    if (id && label && x !== undefined && y !== undefined) targets.push({ id, label, x, y });
  });
  if (!targets.length) {
    pushIssue(issues, path, "must contain at least one target");
    return undefined;
  }
  return targets;
}

function parseImageHotspots(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioHotspotSpec[] | undefined {
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array");
    return undefined;
  }
  const hotspots: StudioHotspotSpec[] = [];
  raw.forEach((item, index) => {
    const hotspotPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      pushIssue(issues, hotspotPath, "must be an object");
      return;
    }
    const id = parseString(item.id, `${hotspotPath}.id`, issues);
    const label = parseString(item.label, `${hotspotPath}.label`, issues);
    const x = parseNumber(item.x, `${hotspotPath}.x`, issues);
    const y = parseNumber(item.y, `${hotspotPath}.y`, issues);
    if (id === undefined || label === undefined || x === undefined || y === undefined) return;
    const blocks = parseBlocks(item.blocks, `${hotspotPath}.blocks`, issues);
    hotspots.push({ id, label, x, y, blocks });
  });
  if (!hotspots.length) {
    pushIssue(issues, path, "must contain at least one hotspot");
    return undefined;
  }
  return hotspots;
}

function parseDialogCards(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioDialogCard[] | undefined {
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array");
    return undefined;
  }
  const cards: StudioDialogCard[] = [];
  raw.forEach((item, index) => {
    const cardPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      pushIssue(issues, cardPath, "must be an object");
      return;
    }
    const front = parseString(item.front, `${cardPath}.front`, issues);
    const back = parseString(item.back, `${cardPath}.back`, issues);
    if (front && back) cards.push({ front, back });
  });
  if (!cards.length) {
    pushIssue(issues, path, "must contain at least one card");
    return undefined;
  }
  return cards;
}

function parseFlashcards(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioFlashcard[] | undefined {
  return parseDialogCards(raw, path, issues);
}

function parseImageSlides(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioImageSlide[] | undefined {
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array");
    return undefined;
  }
  const slides: StudioImageSlide[] = [];
  raw.forEach((item, index) => {
    const slidePath = `${path}[${index}]`;
    if (!isRecord(item)) {
      pushIssue(issues, slidePath, "must be an object");
      return;
    }
    const src = parseString(item.src, `${slidePath}.src`, issues);
    const alt = parseString(item.alt, `${slidePath}.alt`, issues, { required: false }) ?? "";
    const caption = parseString(item.caption, `${slidePath}.caption`, issues, { required: false });
    if (!src) return;
    slides.push({ src, alt, ...(caption ? { caption } : {}) });
  });
  if (!slides.length) {
    pushIssue(issues, path, "must contain at least one slide");
    return undefined;
  }
  return slides;
}

function parseBlocks(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioBlock[] {
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array");
    return [];
  }
  const blocks: StudioBlock[] = [];
  raw.forEach((item, index) => {
    const block = parseBlock(item, `${path}[${index}]`, issues);
    if (block) blocks.push(block);
  });
  return blocks;
}

function parseBlock(
  raw: unknown,
  path: string,
  issues: StudioValidationIssue[],
): StudioBlock | undefined {
  if (!isRecord(raw)) {
    pushIssue(issues, path, "must be an object");
    return undefined;
  }
  const type = parseString(raw.type, `${path}.type`, issues);
  if (!type || !BLOCK_TYPES.includes(type as (typeof BLOCK_TYPES)[number])) {
    if (type) pushIssue(issues, `${path}.type`, `must be one of ${BLOCK_TYPES.join(", ")}`);
    return undefined;
  }
  const id = parseString(raw.id, `${path}.id`, issues);
  if (!id) return undefined;

  switch (type) {
    case "text": {
      const text = parseString(raw.text, `${path}.text`, issues);
      if (!text) return undefined;
      return { type: "text", id, text };
    }
    case "heading": {
      const text = parseString(raw.text, `${path}.text`, issues);
      const level = parsePositiveInt(raw.level, `${path}.level`, issues, [1, 2, 3]);
      if (!text || level === undefined) return undefined;
      return { type: "heading", id, level: level as 1 | 2 | 3, text };
    }
    case "image": {
      const src = parseString(raw.src, `${path}.src`, issues);
      const alt = parseString(raw.alt, `${path}.alt`, issues, { required: false }) ?? "";
      if (!src) return undefined;
      return { type: "image", id, src, alt };
    }
    case "button": {
      const label = parseString(raw.label, `${path}.label`, issues);
      const href = parseString(raw.href, `${path}.href`, issues, { required: false });
      if (!label) return undefined;
      return { type: "button", id, label, ...(href ? { href } : {}) };
    }
    case "input": {
      const label = parseString(raw.label, `${path}.label`, issues);
      if (!label) return undefined;
      const inputTypeRaw = raw.inputType;
      let inputType: "text" | "email" | "number" | undefined;
      if (inputTypeRaw !== undefined) {
        if (inputTypeRaw === "text" || inputTypeRaw === "email" || inputTypeRaw === "number") {
          inputType = inputTypeRaw;
        } else {
          pushIssue(issues, `${path}.inputType`, 'must be "text", "email", or "number"');
          return undefined;
        }
      }
      const placeholder = parseString(raw.placeholder, `${path}.placeholder`, issues, {
        required: false,
      });
      return {
        type: "input",
        id,
        label,
        ...(inputType ? { inputType } : {}),
        ...(placeholder ? { placeholder } : {}),
      };
    }
    case "container": {
      const blocks = parseBlocks(raw.blocks, `${path}.blocks`, issues);
      return { type: "container", id, blocks };
    }
    case "quiz": {
      const checkId = parseString(raw.checkId, `${path}.checkId`, issues);
      const question = parseString(raw.question, `${path}.question`, issues);
      const answer = parseString(raw.answer, `${path}.answer`, issues);
      if (!checkId || !question || !answer) return undefined;
      if (!Array.isArray(raw.choices)) {
        pushIssue(issues, `${path}.choices`, "must be an array of strings");
        return undefined;
      }
      const choices = raw.choices.filter((c): c is string => typeof c === "string" && c.trim().length > 0);
      if (!choices.length) {
        pushIssue(issues, `${path}.choices`, "must contain at least one choice");
        return undefined;
      }
      return { type: "quiz", id, checkId, question, choices, answer };
    }
    case "scenario": {
      const blockId = parseString(raw.blockId, `${path}.blockId`, issues, { required: false });
      const blocks = parseBlocks(raw.blocks, `${path}.blocks`, issues);
      return {
        type: "scenario",
        id,
        blocks,
        ...(blockId ? { blockId } : {}),
      };
    }
    case "checklist": {
      if (!Array.isArray(raw.items)) {
        pushIssue(issues, `${path}.items`, "must be an array of strings");
        return undefined;
      }
      const items = raw.items.filter((i): i is string => typeof i === "string" && i.trim().length > 0);
      if (!items.length) {
        pushIssue(issues, `${path}.items`, "must contain at least one item");
        return undefined;
      }
      return { type: "checklist", id, items };
    }
    case "video": {
      const src = parseString(raw.src, `${path}.src`, issues);
      const title = parseString(raw.title, `${path}.title`, issues, { required: false });
      if (!src) return undefined;
      return { type: "video", id, src, ...(title ? { title } : {}) };
    }
    case "trueFalse": {
      const checkId = parseString(raw.checkId, `${path}.checkId`, issues);
      const question = parseString(raw.question, `${path}.question`, issues);
      const answer = parseBoolean(raw.answer, `${path}.answer`, issues);
      if (!checkId || !question || answer === undefined) return undefined;
      return { type: "trueFalse", id, checkId, question, answer };
    }
    case "fillInTheBlanks": {
      const checkId = parseString(raw.checkId, `${path}.checkId`, issues);
      const template = parseString(raw.template, `${path}.template`, issues);
      if (!checkId || !template) return undefined;
      const blanks = parseFillInBlanks(raw.blanks, `${path}.blanks`, issues);
      return { type: "fillInTheBlanks", id, checkId, template, ...(blanks ? { blanks } : {}) };
    }
    case "markTheWords": {
      const checkId = parseString(raw.checkId, `${path}.checkId`, issues);
      const text = parseString(raw.text, `${path}.text`, issues);
      const correctWords = parseStringArray(raw.correctWords, `${path}.correctWords`, issues);
      if (!checkId || !text || !correctWords) return undefined;
      return { type: "markTheWords", id, checkId, text, correctWords };
    }
    case "dragTheWords": {
      const checkId = parseString(raw.checkId, `${path}.checkId`, issues);
      const template = parseString(raw.template, `${path}.template`, issues);
      const words = parseStringArray(raw.words, `${path}.words`, issues);
      if (!checkId || !template || !words) return undefined;
      return { type: "dragTheWords", id, checkId, template, words };
    }
    case "dragAndDrop": {
      const checkId = parseString(raw.checkId, `${path}.checkId`, issues);
      const items = parseDragItems(raw.items, `${path}.items`, issues);
      const targets = parseDropTargets(raw.targets, `${path}.targets`, issues);
      if (!checkId || !items || !targets) return undefined;
      return { type: "dragAndDrop", id, checkId, items, targets };
    }
    case "page": {
      const blockId = parseString(raw.blockId, `${path}.blockId`, issues);
      const title = parseString(raw.title, `${path}.title`, issues, { required: false });
      if (!blockId) return undefined;
      const blocks = parseBlocks(raw.blocks, `${path}.blocks`, issues);
      return {
        type: "page",
        id,
        blockId,
        blocks,
        ...(title ? { title } : {}),
      };
    }
    case "interactiveBook": {
      const blockId = parseString(raw.blockId, `${path}.blockId`, issues);
      const title = parseString(raw.title, `${path}.title`, issues);
      const pages = parsePageBlockItems(raw.pages, `${path}.pages`, issues);
      const showBookScore =
        raw.showBookScore === undefined ? undefined : parseBoolean(raw.showBookScore, `${path}.showBookScore`, issues);
      if (!blockId || !title || showBookScore === undefined && raw.showBookScore !== undefined) {
        return undefined;
      }
      return {
        type: "interactiveBook",
        id,
        blockId,
        title,
        pages,
        ...(showBookScore !== undefined ? { showBookScore } : {}),
      };
    }
    case "assessmentSequence": {
      const blockId = parseString(raw.blockId, `${path}.blockId`, issues, { required: false });
      const sequential =
        raw.sequential === undefined
          ? undefined
          : parseBoolean(raw.sequential, `${path}.sequential`, issues);
      if (raw.sequential !== undefined && sequential === undefined) return undefined;
      const blocks = parseBlocks(raw.blocks, `${path}.blocks`, issues);
      return {
        type: "assessmentSequence",
        id,
        blocks,
        ...(blockId ? { blockId } : {}),
        ...(sequential !== undefined ? { sequential } : {}),
      };
    }
    case "accordion": {
      const blockId = parseString(raw.blockId, `${path}.blockId`, issues);
      const sections = parseAccordionSections(raw.sections, `${path}.sections`, issues);
      if (!blockId || !sections.length) {
        if (blockId && !sections.length) {
          pushIssue(issues, `${path}.sections`, "must contain at least one section");
        }
        return undefined;
      }
      return { type: "accordion", id, blockId, sections };
    }
    case "dialogCards": {
      const blockId = parseString(raw.blockId, `${path}.blockId`, issues);
      const cards = parseDialogCards(raw.cards, `${path}.cards`, issues);
      if (!blockId || !cards) return undefined;
      return { type: "dialogCards", id, blockId, cards };
    }
    case "flashcards": {
      const blockId = parseString(raw.blockId, `${path}.blockId`, issues);
      const cards = parseFlashcards(raw.cards, `${path}.cards`, issues);
      const selfScore =
        raw.selfScore === undefined
          ? undefined
          : parseBoolean(raw.selfScore, `${path}.selfScore`, issues);
      if (!blockId || !cards || (raw.selfScore !== undefined && selfScore === undefined)) {
        return undefined;
      }
      return {
        type: "flashcards",
        id,
        blockId,
        cards,
        ...(selfScore !== undefined ? { selfScore } : {}),
      };
    }
    case "imageHotspots": {
      const blockId = parseString(raw.blockId, `${path}.blockId`, issues);
      const src = parseString(raw.src, `${path}.src`, issues);
      const alt = parseString(raw.alt, `${path}.alt`, issues, { required: false }) ?? "";
      const hotspots = parseImageHotspots(raw.hotspots, `${path}.hotspots`, issues);
      if (!blockId || !src || !hotspots) return undefined;
      return { type: "imageHotspots", id, blockId, src, alt, hotspots };
    }
    case "imageSlider": {
      const blockId = parseString(raw.blockId, `${path}.blockId`, issues);
      const slides = parseImageSlides(raw.slides, `${path}.slides`, issues);
      if (!blockId || !slides) return undefined;
      return { type: "imageSlider", id, blockId, slides };
    }
    case "findHotspot": {
      const checkId = parseString(raw.checkId, `${path}.checkId`, issues);
      const src = parseString(raw.src, `${path}.src`, issues);
      const alt = parseString(raw.alt, `${path}.alt`, issues, { required: false }) ?? "";
      const targets = parseHotspotTargets(raw.targets, `${path}.targets`, issues);
      const correctTargetId = parseString(raw.correctTargetId, `${path}.correctTargetId`, issues);
      if (!checkId || !src || !targets || !correctTargetId) return undefined;
      return { type: "findHotspot", id, checkId, src, alt, targets, correctTargetId };
    }
    case "findMultipleHotspots": {
      const checkId = parseString(raw.checkId, `${path}.checkId`, issues);
      const src = parseString(raw.src, `${path}.src`, issues);
      const alt = parseString(raw.alt, `${path}.alt`, issues, { required: false }) ?? "";
      const targets = parseHotspotTargets(raw.targets, `${path}.targets`, issues);
      const correctTargetIds = parseStringArray(
        raw.correctTargetIds,
        `${path}.correctTargetIds`,
        issues,
      );
      if (!checkId || !src || !targets || !correctTargetIds) return undefined;
      return { type: "findMultipleHotspots", id, checkId, src, alt, targets, correctTargetIds };
    }
    /* v8 ignore start -- BLOCK_TYPES exhaustiveness */
    default:
      return undefined;
    /* v8 ignore stop */
  }
}

function parsePages(
  raw: unknown,
  issues: StudioValidationIssue[],
): StudioPage[] {
  const path = "pages";
  if (!Array.isArray(raw)) {
    pushIssue(issues, path, "must be an array");
    return [];
  }
  const pages: StudioPage[] = [];
  raw.forEach((item, index) => {
    const pagePath = `${path}[${index}]`;
    if (!isRecord(item)) {
      pushIssue(issues, pagePath, "must be an object");
      return;
    }
    const id = parseString(item.id, `${pagePath}.id`, issues);
    const title = parseString(item.title, `${pagePath}.title`, issues);
    if (!id || !title) return;
    const blocks = parseBlocks(item.blocks, `${pagePath}.blocks`, issues);
    pages.push({ id, title, blocks });
  });
  return pages;
}

export function parseStudioProject(raw: unknown, label = "project"): ParseStudioProjectResult {
  const issues: StudioValidationIssue[] = [];
  if (!isRecord(raw)) {
    return { ok: false, issues: [{ path: label, message: "must be a JSON object" }] };
  }

  let schemaVersion = raw.schemaVersion;
  if (schemaVersion === "1") schemaVersion = 1;
  if (schemaVersion !== studioSchemaVersion) {
    pushIssue(
      issues,
      "schemaVersion",
      `must be ${studioSchemaVersion} (got ${String(raw.schemaVersion)})`,
    );
  }

  if (!isRecord(raw.course)) {
    pushIssue(issues, "course", "must be an object");
  } else {
    parseString(raw.course.courseId, "course.courseId", issues);
    parseString(raw.course.title, "course.title", issues);
  }

  const pages = parsePages(raw.pages, issues);

  if (issues.length) return { ok: false, issues };

  const courseId = (raw.course as Record<string, unknown>).courseId as string;
  const courseTitle = (raw.course as Record<string, unknown>).title as string;

  const project: StudioProjectV1 = {
    schemaVersion: studioSchemaVersion,
    course: { courseId, title: courseTitle },
    pages,
  };

  return { ok: true, project };
}

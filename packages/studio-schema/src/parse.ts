import type {
  StudioBlock,
  StudioPage,
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
] as const;

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

import { validateId } from "@lessonkit/core";
import type {
  StudioBlock,
  StudioProjectV1,
  StudioValidationIssue,
  ValidateStudioProjectResult,
} from "./types";
import { maxContainerNestingDepth } from "./types";

const INPUT_TYPES = ["text", "email", "number"] as const;

function validateBlockContent(
  block: StudioBlock,
  blockPath: string,
  issues: StudioValidationIssue[],
): void {
  switch (block.type) {
    case "text":
      if (!block.text.trim()) {
        issues.push({ path: `${blockPath}.text`, message: "must not be empty" });
      }
      break;
    case "heading":
      if (!block.text.trim()) {
        issues.push({ path: `${blockPath}.text`, message: "must not be empty" });
      }
      break;
    case "image":
      if (!block.src.trim()) {
        issues.push({ path: `${blockPath}.src`, message: "must not be empty" });
      }
      break;
    case "video":
      if (!block.src.trim()) {
        issues.push({ path: `${blockPath}.src`, message: "must not be empty" });
      }
      break;
    case "button":
      if (!block.label.trim()) {
        issues.push({ path: `${blockPath}.label`, message: "must not be empty" });
      }
      break;
    case "input":
      if (!block.label.trim()) {
        issues.push({ path: `${blockPath}.label`, message: "must not be empty" });
      }
      if (
        block.inputType !== undefined &&
        !INPUT_TYPES.includes(block.inputType as (typeof INPUT_TYPES)[number])
      ) {
        issues.push({
          path: `${blockPath}.inputType`,
          message: 'must be "text", "email", or "number"',
        });
      }
      break;
    case "checklist":
      if (!block.items.some((item) => item.trim().length > 0)) {
        issues.push({
          path: `${blockPath}.items`,
          message: "must contain at least one item",
        });
      }
      break;
    case "quiz":
      if (!block.question.trim()) {
        issues.push({ path: `${blockPath}.question`, message: "must not be empty" });
      }
      if (!block.choices.some((c) => c.trim().length > 0)) {
        issues.push({
          path: `${blockPath}.choices`,
          message: "must contain at least one choice",
        });
      }
      break;
    default:
      break;
  }
}

function validateBlockIds(
  blocks: StudioBlock[],
  path: string,
  issues: StudioValidationIssue[],
  seenIds: Set<string>,
  depth: number,
  seenCheckIds: Map<string, string>,
): void {
  if (depth > maxContainerNestingDepth) {
    issues.push({
      path,
      message: `nesting exceeds maximum depth of ${maxContainerNestingDepth}`,
    });
    return;
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!;
    const blockPath = `${path}[${i}]`;

    const idResult = validateId(block.id, `${blockPath}.id`);
    if (!idResult.ok) {
      issues.push(...idResult.issues);
    } else if (seenIds.has(block.id)) {
      issues.push({ path: `${blockPath}.id`, message: `duplicate block id "${block.id}"` });
    } else {
      seenIds.add(block.id);
    }

    validateBlockContent(block, blockPath, issues);

    switch (block.type) {
      case "quiz": {
        const checkResult = validateId(block.checkId, `${blockPath}.checkId`);
        if (!checkResult.ok) issues.push(...checkResult.issues);
        else if (seenCheckIds.has(block.checkId)) {
          issues.push({
            path: `${blockPath}.checkId`,
            message: `duplicate checkId "${block.checkId}" (also at ${seenCheckIds.get(block.checkId)})`,
          });
        } else {
          seenCheckIds.set(block.checkId, blockPath);
        }
        if (!block.choices.includes(block.answer)) {
          issues.push({
            path: `${blockPath}.answer`,
            message: "answer must match one of the choices",
          });
        }
        break;
      }
      case "scenario": {
        if (block.blockId) {
          const blockIdResult = validateId(block.blockId, `${blockPath}.blockId`);
          if (!blockIdResult.ok) issues.push(...blockIdResult.issues);
        }
        validateBlockIds(
          block.blocks,
          `${blockPath}.blocks`,
          issues,
          seenIds,
          depth + 1,
          seenCheckIds,
        );
        break;
      }
      case "container":
        validateBlockIds(
          block.blocks,
          `${blockPath}.blocks`,
          issues,
          seenIds,
          depth + 1,
          seenCheckIds,
        );
        break;
      default:
        break;
    }
  }
}

export function validateStudioProject(project: StudioProjectV1): ValidateStudioProjectResult {
  const issues: StudioValidationIssue[] = [];

  if (project.schemaVersion !== 1) {
    issues.push({
      path: "schemaVersion",
      message: `unsupported schemaVersion ${String(project.schemaVersion)}`,
    });
  }

  const courseIdResult = validateId(project.course.courseId, "course.courseId");
  if (!courseIdResult.ok) issues.push(...courseIdResult.issues);

  if (!project.course.title.trim()) {
    issues.push({ path: "course.title", message: "must not be empty" });
  }

  if (!project.pages.length) {
    issues.push({ path: "pages", message: "must contain at least one page" });
  }

  const pageIds = new Set<string>();
  const seenCheckIds = new Map<string, string>();

  for (let i = 0; i < project.pages.length; i++) {
    const page = project.pages[i]!;
    const pagePath = `pages[${i}]`;
    const lessonResult = validateId(page.id, `${pagePath}.id`);
    if (!lessonResult.ok) {
      issues.push(...lessonResult.issues);
    } else if (pageIds.has(page.id)) {
      issues.push({ path: `${pagePath}.id`, message: `duplicate page id "${page.id}"` });
    } else {
      pageIds.add(page.id);
    }

    if (!page.title.trim()) {
      issues.push({ path: `${pagePath}.title`, message: "must not be empty" });
    }

    const seenBlockIds = new Set<string>();
    validateBlockIds(page.blocks, `${pagePath}.blocks`, issues, seenBlockIds, 0, seenCheckIds);
  }

  return issues.length ? { ok: false, issues } : { ok: true };
}

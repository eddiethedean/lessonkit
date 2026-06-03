import type { CheckId } from "@lessonkit/core";
import type { AssessmentDescriptor } from "@lessonkit/lxpack";
import type {
  StudioBlock,
  StudioDragAndDropBlock,
  StudioMarkTheWordsBlock,
  StudioProjectV1,
} from "@lessonkit/studio-schema";

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

function questionFromTemplate(template: string): string {
  const plain = template.replace(/\*[^*]+\*/g, "___").trim();
  return plain.length ? plain.slice(0, 200) : "Complete the activity";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function markTheWordsTemplate(block: StudioMarkTheWordsBlock): string {
  let text = block.text;
  for (const word of block.correctWords) {
    if (!word.trim()) continue;
    text = text.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`), `*${word}*`);
  }
  return text;
}

function dragAndDropToMcq(block: StudioDragAndDropBlock): AssessmentDescriptor {
  const firstTarget = block.targets[0];
  const answerItem = firstTarget
    ? block.items.find((item) => item.id === firstTarget.accepts)
    : block.items[0];
  const choices = block.items.map((item) => item.label).filter((label) => label.trim().length > 0);
  const answer = answerItem?.label?.trim() || choices[0] || "";
  return {
    kind: "mcq",
    checkId: block.checkId,
    question: "Complete the drag and drop activity",
    choices: choices.length ? choices : [answer],
    answer,
    passingScore: 1,
  };
}

function blockToAssessment(block: StudioBlock): AssessmentDescriptor | null {
  switch (block.type) {
    case "quiz":
      return {
        checkId: block.checkId,
        question: block.question,
        choices: [...block.choices],
        answer: block.answer,
        passingScore: 1,
      };
    case "trueFalse":
      return {
        kind: "trueFalse",
        checkId: block.checkId,
        question: block.question,
        answer: block.answer,
        passingScore: 1,
      };
    case "fillInTheBlanks":
      return {
        kind: "fillInBlanks",
        checkId: block.checkId,
        question: questionFromTemplate(block.template),
        template: block.template,
        blanks: block.blanks ? block.blanks.map((b) => ({ id: b.id, answer: b.answer })) : undefined,
        passingScore: 1,
      };
    case "markTheWords":
      return {
        kind: "fillInBlanks",
        checkId: block.checkId,
        question: block.text.trim().slice(0, 200) || "Mark the correct words",
        template: markTheWordsTemplate(block),
        passingScore: 1,
      };
    case "dragTheWords":
      return {
        kind: "fillInBlanks",
        checkId: block.checkId,
        question: questionFromTemplate(block.template),
        template: block.template,
        passingScore: 1,
      };
    case "dragAndDrop":
      return dragAndDropToMcq(block);
    case "findHotspot":
      return {
        kind: "findHotspot",
        checkId: block.checkId,
        question: block.alt.trim() || "Find the correct hotspot",
        src: block.src,
        alt: block.alt,
        correctTargetId: block.correctTargetId,
        passingScore: 1,
      };
    case "findMultipleHotspots":
      return {
        kind: "findMultipleHotspots",
        checkId: block.checkId,
        question: block.alt.trim() || "Find the correct hotspots",
        src: block.src,
        alt: block.alt,
        correctTargetIds: [...block.correctTargetIds],
        passingScore: 1,
      };
    default:
      return null;
  }
}

export function collectAssessments(project: StudioProjectV1): AssessmentDescriptor[] {
  const seen = new Set<CheckId>();
  const assessments: AssessmentDescriptor[] = [];

  for (const page of project.pages) {
    walkBlocks(page.blocks, (block) => {
      const descriptor = blockToAssessment(block);
      if (!descriptor) return;
      if (seen.has(descriptor.checkId)) {
        throw new Error(`Duplicate checkId in project: ${descriptor.checkId}`);
      }
      seen.add(descriptor.checkId);
      assessments.push(descriptor);
    });
  }

  return assessments;
}

/** @deprecated Use {@link collectAssessments}. */
export const collectQuizAssessments = collectAssessments;

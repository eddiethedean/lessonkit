import type { CheckId } from "@lessonkit/core";
import type { AssessmentDescriptor } from "@lessonkit/lxpack";
import type { StudioBlock, StudioProjectV1 } from "@lessonkit/studio-schema";

export function walkBlocks(blocks: StudioBlock[], visit: (block: StudioBlock) => void): void {
  for (const block of blocks) {
    visit(block);
    if (block.type === "container" || block.type === "scenario") {
      walkBlocks(block.blocks, visit);
    }
  }
}

export function collectQuizAssessments(project: StudioProjectV1): AssessmentDescriptor[] {
  const seen = new Set<CheckId>();
  const assessments: AssessmentDescriptor[] = [];

  for (const page of project.pages) {
    walkBlocks(page.blocks, (block) => {
      if (block.type !== "quiz") return;
      if (seen.has(block.checkId)) {
        throw new Error(`Duplicate checkId in project: ${block.checkId}`);
      }
      seen.add(block.checkId);
      assessments.push({
        checkId: block.checkId,
        question: block.question,
        choices: [...block.choices],
        answer: block.answer,
        passingScore: 1,
      });
    });
  }

  return assessments;
}

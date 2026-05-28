import type { AssessmentDescriptor } from "./types";
import { assessmentDescriptorToLxpack } from "./assessments";

function yamlQuote(value: string): string {
  return JSON.stringify(value);
}

export function emitAssessmentYaml(assessment: AssessmentDescriptor): string {
  const lx = assessmentDescriptorToLxpack(assessment);
  const lines: string[] = [];
  lines.push(`id: ${lx.id}`);
  lines.push(`passingScore: ${lx.passingScore}`);
  lines.push("questions:");
  for (const question of lx.questions) {
    lines.push(`  - id: ${question.id}`);
    lines.push(`    prompt: ${yamlQuote(question.prompt)}`);
    lines.push("    choices:");
    for (const choice of question.choices) {
      lines.push(`      - id: ${choice.id}`);
      lines.push(`        text: ${yamlQuote(choice.text)}`);
      if (choice.correct) lines.push("        correct: true");
    }
  }
  return `${lines.join("\n")}\n`;
}

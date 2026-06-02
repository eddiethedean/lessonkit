import type { StudioBlock, StudioProjectV1 } from "@lessonkit/studio-schema";
import { jsxStringArray, jsxStringLiteral } from "./escapeJsx";

export function emitBlockJsx(block: StudioBlock, indent: string): string {
  switch (block.type) {
    case "text":
      return `${indent}<p className="lk-studio-text">${escapeHtmlText(block.text)}</p>`;
    case "heading": {
      const tag = `h${block.level}`;
      return `${indent}<${tag} className="lk-studio-heading">${escapeHtmlText(block.text)}</${tag}>`;
    }
    case "image":
      return `${indent}<img className="lk-studio-image" src=${jsxStringLiteral(block.src)} alt=${jsxStringLiteral(block.alt)} />`;
    case "button": {
      const href = block.href
        ? ` href=${jsxStringLiteral(block.href)}`
        : "";
      return `${indent}<a className="lk-studio-button"${href}>${escapeHtmlText(block.label)}</a>`;
    }
    case "input":
      return `${indent}<label className="lk-studio-input">\n${indent}  <span>${escapeHtmlText(block.label)}</span>\n${indent}  <input type=${jsxStringLiteral(block.inputType ?? "text")} placeholder=${jsxStringLiteral(block.placeholder ?? "")} />\n${indent}</label>`;
    case "container":
      return `${indent}<div className="lk-studio-container">\n${emitBlocksJsx(block.blocks, indent + "  ")}\n${indent}</div>`;
    case "quiz":
      return `${indent}<Quiz\n${indent}  checkId=${jsxStringLiteral(block.checkId)}\n${indent}  question=${jsxStringLiteral(block.question)}\n${indent}  choices={${jsxStringArray(block.choices)}}\n${indent}  answer=${jsxStringLiteral(block.answer)}\n${indent}/>`;
    case "scenario": {
      const blockId = block.blockId ? `\n${indent}  blockId=${jsxStringLiteral(block.blockId)}` : "";
      return `${indent}<Scenario${blockId}>\n${emitBlocksJsx(block.blocks, indent + "  ")}\n${indent}</Scenario>`;
    }
    case "checklist":
      return `${indent}<ul className="lk-studio-checklist">\n${block.items.map((item) => `${indent}  <li><label><input type="checkbox" readOnly /> ${escapeHtmlText(item)}</label></li>`).join("\n")}\n${indent}</ul>`;
    case "video": {
      const title = block.title ? ` title=${jsxStringLiteral(block.title)}` : "";
      return `${indent}<video className="lk-studio-video" src=${jsxStringLiteral(block.src)} controls${title} />`;
    }
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

export function emitBlocksJsx(blocks: StudioBlock[], indent: string): string {
  return blocks.map((block) => emitBlockJsx(block, indent)).join("\n");
}

export function emitAppTsx(project: StudioProjectV1, themePreset: string): string {
  const lessons = project.pages
    .map((page) => {
      const body = emitBlocksJsx(page.blocks, "          ");
      return `        <Lesson title=${jsxStringLiteral(page.title)} lessonId=${jsxStringLiteral(page.id)}>\n${body}\n        </Lesson>`;
    })
    .join("\n");

  return `import React from "react";
import { Course, Lesson, Quiz, Scenario, ThemeProvider } from "@lessonkit/react";
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

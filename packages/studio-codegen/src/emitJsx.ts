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

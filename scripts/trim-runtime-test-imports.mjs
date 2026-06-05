import fs from "node:fs";
import path from "node:path";

const testDir = path.join("packages/react/test");
const files = fs
  .readdirSync(testDir)
  .filter((f) => f.startsWith("runtime") && f.endsWith(".test.tsx"));

const RULES = [
  { id: "react", test: /\bReact\b|\buseState\b/, lines: ['import React, { useState } from "react";'] },
  { id: "vitest", test: /\bdescribe\b|\bit\b|\bexpect\b|\bvi\b|\bafterEach\b/, lines: ['import { afterEach, describe, expect, it, vi } from "vitest";'] },
  {
    id: "rtl",
    test: /\bact\b|\bcleanup\b|\bfireEvent\b|\brender\b|\bscreen\b|\bwaitFor\b/,
    lines: ['import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";'],
  },
  {
    id: "src",
    test: /\bCourse\b|\bKnowledgeCheck\b|\bLesson\b|\bLessonkitProvider\b|\bProgressTracker\b|\bQuiz\b|\bReflection\b|\bScenario\b|\bresetQuizWarningsForTests\b|\buseCompletion\b|\buseLessonkit\b|\buseProgress\b|\buseQuizState\b|\buseTracking\b/,
    lines: [
      'import { Course, KnowledgeCheck, Lesson, LessonkitProvider, ProgressTracker, Quiz, Reflection, Scenario, resetQuizWarningsForTests, useCompletion, useLessonkit, useProgress, useQuizState, useTracking } from "../src";',
    ],
  },
  {
    id: "lessonMount",
    test: /\bresetLessonMountRegistryForTests\b/,
    lines: ['import { resetLessonMountRegistryForTests } from "../src/runtime/lessonMountRegistry";'],
  },
  {
    id: "providerRuntime",
    test: /\bresetCourseStartedTrackingFlightForTests\b|\bresetLessonkitProviderStorageForTests\b/,
    lines: [
      'import { resetCourseStartedTrackingFlightForTests, resetLessonkitProviderStorageForTests } from "../src/provider/useLessonkitProviderRuntime";',
    ],
  },
  {
    id: "core",
    test: /\bdefineAssessmentPlugin\b|\bdefineLifecyclePlugin\b|\bdefineTelemetryPlugin\b|\bTelemetryEvent\b|\bTelemetrySink\b/,
    lines: [
      'import { defineAssessmentPlugin, defineLifecyclePlugin, defineTelemetryPlugin, type TelemetryEvent, type TelemetrySink } from "@lessonkit/core";',
    ],
  },
  { id: "xapiMod", test: /\bxapiModule\b/, lines: ['import * as xapiModule from "@lessonkit/xapi";'] },
  {
    id: "xapiTypes",
    test: /\bXAPIStatement\b|\bXAPITransport\b/,
    lines: ['import type { XAPIStatement, XAPITransport } from "@lessonkit/xapi";'],
  },
  {
    id: "courseStartedPipeline",
    test: /\bcourseStartedPipelineModule\b/,
    lines: ['import * as courseStartedPipelineModule from "../src/runtime/courseStartedPipeline";'],
  },
  {
    id: "ports",
    test: /\bcreateSessionStoragePort\b/,
    lines: ['import { createSessionStoragePort } from "../src/runtime/ports";'],
  },
  {
    id: "session",
    test: /\bmarkCourseStarted\b|\bmarkCourseStartedEmittedToTracking\b|\bmarkCourseStartedPipelineDelivered\b/,
    lines: [
      'import { markCourseStarted, markCourseStartedEmittedToTracking, markCourseStartedPipelineDelivered } from "../src/runtime/session";',
    ],
  },
  {
    id: "setup",
    test: /\bregisterRuntimeTestCleanup\b/,
    lines: ['import { registerRuntimeTestCleanup } from "./runtime.testSetup";'],
  },
];

function trimImports(body, existingHeader) {
  const text = body;
  const lines = ['import { registerRuntimeTestCleanup } from "./runtime.testSetup";'];
  if (/\buseState\b/.test(text)) {
    lines.unshift('import React, { useState } from "react";');
  } else if (/\bReact\b/.test(text)) {
    lines.unshift('import React from "react";');
  }

  const vitestSyms = [];
  if (/\bdescribe\b/.test(text)) vitestSyms.push("describe");
  if (/\bit\b/.test(text)) vitestSyms.push("it");
  if (/\bexpect\b/.test(text)) vitestSyms.push("expect");
  if (/\bvi\b/.test(text)) vitestSyms.push("vi");
  if (/\bafterEach\b/.test(text)) vitestSyms.push("afterEach");
  if (vitestSyms.length) lines.push(`import { ${vitestSyms.join(", ")} } from "vitest";`);

  const rtlSyms = [];
  for (const s of ["act", "cleanup", "fireEvent", "render", "screen", "waitFor"]) {
    if (new RegExp(`\\b${s}\\b`).test(text)) rtlSyms.push(s);
  }
  if (rtlSyms.length) lines.push(`import { ${rtlSyms.join(", ")} } from "@testing-library/react";`);

  const srcSyms = [
    "Course",
    "KnowledgeCheck",
    "Lesson",
    "LessonkitProvider",
    "ProgressTracker",
    "Quiz",
    "Reflection",
    "Scenario",
    "resetQuizWarningsForTests",
    "useCompletion",
    "useLessonkit",
    "useProgress",
    "useQuizState",
    "useTracking",
  ].filter((s) => new RegExp(`\\b${s}\\b`).test(text));
  if (srcSyms.length) lines.push(`import { ${srcSyms.join(", ")} } from "../src";`);

  if (/\bresetLessonMountRegistryForTests\b/.test(text)) {
    lines.push('import { resetLessonMountRegistryForTests } from "../src/runtime/lessonMountRegistry";');
  }
  if (/\bresetCourseStartedTrackingFlightForTests\b|\bresetLessonkitProviderStorageForTests\b/.test(text)) {
    lines.push(
      'import { resetCourseStartedTrackingFlightForTests, resetLessonkitProviderStorageForTests } from "../src/provider/useLessonkitProviderRuntime";',
    );
  }

  const coreSyms = [
    "defineAssessmentPlugin",
    "defineLifecyclePlugin",
    "defineTelemetryPlugin",
    "TelemetryEvent",
    "TelemetrySink",
  ].filter((s) => new RegExp(`\\b${s}\\b`).test(text));
  if (coreSyms.length) {
    const typeOnly = new Set(["TelemetryEvent", "TelemetrySink"]);
    const vals = coreSyms.filter((s) => !typeOnly.has(s));
    const types = coreSyms.filter((s) => typeOnly.has(s));
    const parts = [...vals, ...types.map((t) => `type ${t}`)];
    lines.push(`import { ${parts.join(", ")} } from "@lessonkit/core";`);
  }

  if (/\bxapiModule\b/.test(text)) lines.push('import * as xapiModule from "@lessonkit/xapi";');
  if (/\bXAPIStatement\b|\bXAPITransport\b/.test(text)) {
    const xapiTypes = ["XAPIStatement", "XAPITransport"].filter((s) => new RegExp(`\\b${s}\\b`).test(text));
    lines.push(`import type { ${xapiTypes.join(", ")} } from "@lessonkit/xapi";`);
  }
  if (/\bcourseStartedPipelineModule\b/.test(text)) {
    lines.push('import * as courseStartedPipelineModule from "../src/runtime/courseStartedPipeline";');
  }
  if (/\bcreateSessionStoragePort\b/.test(text)) {
    lines.push('import { createSessionStoragePort } from "../src/runtime/ports";');
  }
  if (
    /\bmarkCourseStarted\b|\bmarkCourseStartedEmittedToTracking\b|\bmarkCourseStartedPipelineDelivered\b/.test(
      text,
    )
  ) {
    const sessionSyms = [
      "markCourseStarted",
      "markCourseStartedEmittedToTracking",
      "markCourseStartedPipelineDelivered",
    ].filter((s) => new RegExp(`\\b${s}\\b`).test(text));
    lines.push(`import { ${sessionSyms.join(", ")} } from "../src/runtime/session";`);
  }

  return lines.join("\n");
}

for (const file of files) {
  const full = path.join(testDir, file);
  const content = fs.readFileSync(full, "utf8");
  const describeMatch = content.match(/describe\("[^"]+", \(\) => \{[\s\S]*$/);
  if (!describeMatch) continue;
  const describeBlock = describeMatch[0];
  const imports = trimImports(describeBlock, content);
  const newContent = `${imports}\n\n\n${describeBlock}\n`;
  fs.writeFileSync(full, newContent);
  console.log("trimmed", file);
}

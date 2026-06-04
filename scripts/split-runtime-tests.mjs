import fs from "node:fs";
import path from "node:path";

const srcPath = path.join("packages/react/test/runtime.test.tsx");
const src = fs.readFileSync(srcPath, "utf8");

const describeStart = src.indexOf('describe("@lessonkit/react runtime"');
const header = src.slice(0, describeStart).trim();
const bodyStart = src.indexOf("{", describeStart) + 1;
const bodyEnd = src.lastIndexOf("});");
const body = src.slice(bodyStart, bodyEnd);

function extractItBlocks(text) {
  const blocks = [];
  let i = 0;
  while (i < text.length) {
    const match = text.slice(i).match(/^\s*it\s*\(/m);
    if (!match) break;
    const start = i + match.index;
    let depth = 0;
    let j = start;
    let started = false;
    for (; j < text.length; j++) {
      const ch = text[j];
      if (ch === "(" || ch === "{") {
        depth += 1;
        started = true;
      } else if (ch === ")" || ch === "}") {
        depth -= 1;
      }
      if (started && depth === 0 && ch === ")") {
        // end of it(...) call - find trailing ;
        while (j < text.length && text[j] !== ";") j++;
        blocks.push(text.slice(start, j + 1).trim());
        i = j + 1;
        break;
      }
    }
    if (j >= text.length) break;
  }
  return blocks;
}

function getTestName(block) {
  const m = block.match(/it\s*\(\s*["'`]([^"'`]+)["'`]/);
  return m ? m[1] : "";
}

function categorize(name) {
  const n = name.toLowerCase();
  if (n.includes("runtimeversion")) return "runtimeVersion";
  if (
    n.includes("course_started") ||
    n.includes("course started") ||
    n.includes("emitcoursestarted") ||
    n.includes("course initialized xapi") ||
    n.includes("dedupes course_started") ||
    n.includes("marks course_started") ||
    n.includes("does not duplicate course_started") ||
    n.includes("does not re-emit course_started") ||
    n.includes("forwards course_started") ||
    n.includes("retries course_started") ||
    n.includes("flushes batched events before course_started") ||
    n.includes("emits course_started") ||
    n.includes("sends one course-level initialized")
  ) {
    return "courseStarted";
  }
  if (
    n.includes("xapi") ||
    n.includes("quiz_") ||
    n.includes("quiz ") ||
    n.includes("tracking") ||
    n.includes("plugin") ||
    n.includes("lesson lifecycle") ||
    n.includes("lesson_started") ||
    n.includes("lesson_completed") ||
    n.includes("batch") ||
    n.includes("sink") ||
    n.includes("wraptracking") ||
    n.includes("sessionid") ||
    n.includes("session storage") ||
    n.includes("sessionstorage") ||
    n.includes("session config") ||
    n.includes("session when")
  ) {
    return "telemetry";
  }
  return "core";
}

const itBlocks = extractItBlocks(body);
const groups = { courseStarted: [], runtimeVersion: [], telemetry: [], core: [] };
for (const block of itBlocks) {
  groups[categorize(getTestName(block))].push(block);
}

const setupHeader = `${header}
import { registerRuntimeTestCleanup } from "./runtime.testSetup";
`;

function writeSuite(filename, title, tests) {
  if (tests.length === 0) return;
  const content = `${setupHeader}

describe("${title}", () => {
  registerRuntimeTestCleanup();

${tests.join("\n\n")}
});
`;
  fs.writeFileSync(path.join("packages/react/test", filename), content);
  console.log(`${filename}: ${tests.length} tests`);
}

writeSuite(
  "runtime.courseStarted.test.tsx",
  "@lessonkit/react runtime — course_started",
  groups.courseStarted,
);
writeSuite(
  "runtime.runtimeVersion.test.tsx",
  "@lessonkit/react runtime — runtimeVersion",
  groups.runtimeVersion,
);
writeSuite(
  "runtime.telemetry.test.tsx",
  "@lessonkit/react runtime — telemetry",
  groups.telemetry,
);

const coreContent = `${setupHeader}

describe("@lessonkit/react runtime", () => {
  registerRuntimeTestCleanup();

${groups.core.join("\n\n")}
});
`;
fs.writeFileSync(srcPath, coreContent);
console.log(`runtime.test.tsx: ${groups.core.length} tests`);

import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { assertRealPathUnderRoot } from "../spaPath";
import type { BlockTreeNodeV1, BlockTreeV1, ExtractBlockTreeOptions } from "./types";

const SCANNABLE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];
const ID_PROPS = ["courseId", "lessonId", "checkId", "blockId", "nodeId"] as const;

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");
}

function collectSourceUnderSrc(projectRoot: string): string[] {
  const srcDir = join(projectRoot, "src");
  if (!existsSync(srcDir)) return [];

  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      try {
        assertRealPathUnderRoot(projectRoot, abs);
      } catch {
        continue;
      }
      const stat = lstatSync(abs);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) {
        walk(abs);
      } else if (SCANNABLE_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
        results.push(relative(projectRoot, abs));
      }
    }
  };
  walk(srcDir);
  return results;
}

function loadCatalogBlockTypes(blockTypes?: string[]): string[] {
  if (blockTypes?.length) return blockTypes;

  try {
    const require = createRequire(import.meta.url);
    const catalogPath = require.resolve("@lessonkit/react/block-catalog.v3.json");
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as {
      entries?: Array<{ type?: string }>;
    };
    return (catalog.entries ?? [])
      .map((e) => e.type)
      .filter((t): t is string => typeof t === "string" && t.length > 0);
  } catch {
    return [
      "Course",
      "Lesson",
      "Scenario",
      "Quiz",
      "KnowledgeCheck",
      "ProgressTracker",
      "Reflection",
      "TrueFalse",
      "MarkTheWords",
      "FillInTheBlanks",
      "DragTheWords",
      "DragAndDrop",
      "AssessmentSequence",
      "Text",
      "Heading",
      "Image",
      "Video",
      "Page",
      "InteractiveBook",
      "Slide",
      "SlideDeck",
      "TimedCue",
      "InteractiveVideo",
      "Summary",
      "BranchingScenario",
      "BranchNode",
      "BranchChoice",
      "Embed",
      "Chart",
    ];
  }
}

function extractIdProp(tagSource: string, prop: (typeof ID_PROPS)[number]): string | undefined {
  const re = new RegExp(
    `\\b${prop}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{\\s*["'\`]([^"'\`]+)["'\`]\\s*\\})`,
  );
  const match = tagSource.match(re);
  if (!match) return undefined;
  return match[1] ?? match[2] ?? match[3];
}

function parseJsxBlocks(source: string, blockTypes: Set<string>): BlockTreeNodeV1[] {
  const stripped = stripComments(source);
  const tagRe = /<([A-Z][A-Za-z0-9]*)\b([^>]*?)(\/?)>/g;
  const stack: BlockTreeNodeV1[] = [];
  const roots: BlockTreeNodeV1[] = [];

  for (const match of stripped.matchAll(tagRe)) {
    const rawTag = match[1]!;
    const attrs = match[2] ?? "";
    const selfClosing = match[3] === "/";

    if (rawTag === "Fragment" || rawTag.endsWith("Provider")) continue;

    const known = blockTypes.has(rawTag);
    const node: BlockTreeNodeV1 = known
      ? { type: rawTag }
      : { type: "Unknown", rawTag };

    for (const prop of ID_PROPS) {
      const value = extractIdProp(attrs, prop);
      if (value) node[prop] = value;
    }

    if (selfClosing) {
      if (stack.length) {
        const parent = stack[stack.length - 1]!;
        parent.children = parent.children ?? [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
      continue;
    }

    const closeRe = new RegExp(`</${rawTag}>`);
    const closeMatch = closeRe.exec(stripped.slice((match.index ?? 0) + match[0].length));
    if (!closeMatch) {
      if (stack.length) {
        const parent = stack[stack.length - 1]!;
        parent.children = parent.children ?? [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
      continue;
    }

    stack.push(node);
    const nextClose = stripped.indexOf(`</${rawTag}>`, (match.index ?? 0) + match[0].length);
    const inner = stripped.slice((match.index ?? 0) + match[0].length, nextClose);
    if (!inner.includes("<")) {
      stack.pop();
      if (stack.length) {
        const parent = stack[stack.length - 1]!;
        parent.children = parent.children ?? [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return roots.length ? roots : stack;
}

export function extractBlockTree(options: ExtractBlockTreeOptions): BlockTreeV1 {
  const blockTypes = new Set(loadCatalogBlockTypes(options.blockTypes));
  const sources =
    options.appSources ?? collectSourceUnderSrc(options.projectRoot);

  const blocks: BlockTreeNodeV1[] = [];
  for (const rel of sources) {
    const abs = join(options.projectRoot, rel);
    if (!existsSync(abs)) continue;
    const source = readFileSync(abs, "utf8");
    const parsed = parseJsxBlocks(source, blockTypes);
    blocks.push(...parsed);
  }

  return {
    schemaVersion: 1,
    sources,
    blocks,
  };
}

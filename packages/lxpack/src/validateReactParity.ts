import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { isSafeRelativeSpaPath } from "./spaPath";
import type { LessonkitCourseDescriptor } from "./types";

export type ReactParityIssue = {
  path: string;
  message: string;
  severity: "error" | "warning";
};

export type ValidateReactManifestParityOptions = {
  projectRoot: string;
  descriptor: LessonkitCourseDescriptor;
  /** Relative source files to scan (default: all `.tsx` under `src/`). */
  appSources?: string[];
};

const SCANNABLE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

function collectSourceUnderSrc(projectRoot: string): string[] {
  const srcDir = join(projectRoot, "src");
  if (!existsSync(srcDir)) return [];

  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      if (statSync(abs).isDirectory()) {
        walk(abs);
      } else if (SCANNABLE_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
        results.push(relative(projectRoot, abs));
      }
    }
  };
  walk(srcDir);
  return results;
}

function readAppSources(projectRoot: string, appSources: string[]): string {
  return appSources
    .filter((rel) => isSafeRelativeSpaPath(rel))
    .map((rel) => join(projectRoot, rel))
    .filter((abs) => existsSync(abs))
    .map((abs) => readFileSync(abs, "utf8"))
    .join("\n");
}

/** Strip comments so dead code / comments cannot satisfy ID parity. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");
}

/** Mask string/template literals except JSX courseId/checkId attribute values. */
function maskUnrelatedStringLiterals(source: string): string {
  return source.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, (match, _quote, offset, full) => {
    const before = full.slice(Math.max(0, offset - 24), offset);
    if (/\b(?:courseId|checkId)\s*=\s*$/.test(before)) {
      return match;
    }
    return '""';
  });
}

function idPropPresent(source: string, prop: "courseId" | "checkId", id: string): boolean {
  const stripped = stripComments(source);
  const masked = maskUnrelatedStringLiterals(stripped);
  return jsxPropRegex(prop, id).test(masked);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function jsxPropRegex(prop: "courseId" | "checkId", id: string): RegExp {
  const escapedId = escapeRegExp(id);
  return new RegExp(
    `(?<![A-Za-z0-9_$])${prop}\\s*=\\s*(?:` +
      `"${escapedId}"|'${escapedId}'|` +
      `\\{\\s*["'\`]${escapedId}["'\`]\\s*\\}|` +
      `\\{\\s*\`${escapedId}\`\\s*\\}` +
      `)`,
  );
}

function maskStringLiterals(source: string): string {
  return source.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""');
}

function extractStringConstants(source: string): Map<string, string> {
  const stripped = stripComments(source);
  const map = new Map<string, string>();
  const re = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(["'`])((?:\\.|(?!\2).)*)\2/g;
  for (const match of stripped.matchAll(re)) {
    map.set(match[1]!, match[3]!);
  }
  return map;
}

function idUsedViaConstant(
  source: string,
  prop: "courseId" | "checkId",
  id: string,
  constants: Map<string, string>,
): boolean {
  const stripped = stripComments(source);
  const masked = maskStringLiterals(stripped);
  for (const [name, value] of constants) {
    if (value !== id) continue;
    const jsxPatterns = [
      `${prop}={${name}}`,
      `${prop}={ ${name} }`,
      `${prop}={${name} }`,
      `${prop}={ ${name}}`,
    ];
    if (jsxPatterns.some((p) => masked.includes(p))) return true;

    const objPatterns = [`${prop}: ${name}`, `${prop}:${name}`];
    if (objPatterns.some((p) => masked.includes(p))) return true;
  }
  return false;
}

function courseIdPresent(source: string, courseId: string): boolean {
  if (idPropPresent(source, "courseId", courseId)) return true;
  return idUsedViaConstant(source, "courseId", courseId, extractStringConstants(source));
}

function checkIdPresent(source: string, checkId: string): boolean {
  if (idPropPresent(source, "checkId", checkId)) return true;
  return idUsedViaConstant(source, "checkId", checkId, extractStringConstants(source));
}

const ID_SYNC_DOC =
  "https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html#keep-react-ids-in-sync-with-lessonkitjson";

function parityHint(message: string): string {
  return `${message} See ${ID_SYNC_DOC}`;
}

/**
 * Validates that React app source references the same courseId and assessment checkIds
 * as the lessonkit.json descriptor (prevents LMS/runtime ID drift at package time).
 */
export function validateReactManifestParity(
  opts: ValidateReactManifestParityOptions,
): ReactParityIssue[] {
  const appSources = opts.appSources ?? collectSourceUnderSrc(opts.projectRoot);
  const source = readAppSources(opts.projectRoot, appSources);
  const hasDescriptorIds =
    Boolean(opts.descriptor.courseId) || (opts.descriptor.assessments?.length ?? 0) > 0;

  if (!source.trim()) {
    return [
      {
        path: appSources.length > 0 ? appSources.join(", ") : "src/",
        message: hasDescriptorIds
          ? "React app source not found for ID parity check"
          : "React app source not found for ID parity check",
        severity: hasDescriptorIds ? "error" : "warning",
      },
    ];
  }

  const issues: ReactParityIssue[] = [];
  const courseId = opts.descriptor.courseId;

  if (!courseIdPresent(source, courseId)) {
    issues.push({
      path: "course.courseId",
      message: parityHint(
        `React app source does not reference courseId="${courseId}" from lessonkit.json.`,
      ),
      severity: "error",
    });
  }

  for (const assessment of opts.descriptor.assessments ?? []) {
    const checkId = assessment.checkId;
    if (!checkId) continue;
    if (!checkIdPresent(source, checkId)) {
      issues.push({
        path: `assessments.checkId:${checkId}`,
        message: parityHint(
          `React app source missing checkId="${checkId}" declared in lessonkit.json.`,
        ),
        severity: "error",
      });
    }
  }

  return issues;
}

import { readFileSync, existsSync, readdirSync, lstatSync } from "node:fs";
import { join, relative } from "node:path";
import { assertRealPathUnderRoot, isSafeRelativeSpaPath } from "./spaPath";
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

function collectSourceUnderSrc(
  projectRoot: string,
  issues: ReactParityIssue[],
): string[] {
  const srcDir = join(projectRoot, "src");
  if (!existsSync(srcDir)) return [];

  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      let stat;
      try {
        stat = lstatSync(abs);
      } catch {
        continue;
      }
      if (stat.isSymbolicLink()) {
        issues.push({
          path: relative(projectRoot, abs),
          message: `Source tree contains symlink (rejected for parity scan): ${relative(projectRoot, abs)}`,
          severity: "error",
        });
        continue;
      }
      if (stat.isDirectory()) {
        try {
          assertRealPathUnderRoot(projectRoot, abs);
        } catch {
          issues.push({
            path: relative(projectRoot, abs),
            message: `Source directory escapes project root: ${relative(projectRoot, abs)}`,
            severity: "error",
          });
          continue;
        }
        walk(abs);
      } else if (SCANNABLE_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
        try {
          assertRealPathUnderRoot(projectRoot, abs);
        } catch {
          issues.push({
            path: relative(projectRoot, abs),
            message: `Source file escapes project root: ${relative(projectRoot, abs)}`,
            severity: "error",
          });
          continue;
        }
        results.push(relative(projectRoot, abs));
      }
    }
  };
  walk(srcDir);
  return results;
}

function readAppSources(
  projectRoot: string,
  appSources: string[],
  issues: ReactParityIssue[],
  customSourcesProvided: boolean,
): string {
  return appSources
    .map((rel) => {
      if (!isSafeRelativeSpaPath(rel)) {
        if (customSourcesProvided) {
          issues.push({
            path: rel,
            message: `Unsafe appSources path skipped: ${rel}`,
            severity: "warning",
          });
        }
        return null;
      }
      const abs = join(projectRoot, rel);
      try {
        assertRealPathUnderRoot(projectRoot, abs);
        if (existsSync(abs) && lstatSync(abs).isSymbolicLink()) {
          issues.push({
            path: rel,
            message: `appSources path is a symlink: ${rel}`,
            severity: "error",
          });
          return null;
        }
      } catch {
        issues.push({
          path: rel,
          message: `appSources path escapes project root: ${rel}`,
          severity: "error",
        });
        return null;
      }
      if (!existsSync(abs)) return null;
      return readFileSync(abs, "utf8");
    })
    .filter((content): content is string => content != null)
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
    if (/\b(?:courseId|checkId|lessonId)\s*=\s*$/.test(before)) {
      return match;
    }
    return '""';
  });
}

function idPropPresent(source: string, prop: "courseId" | "checkId" | "lessonId", id: string): boolean {
  const stripped = stripComments(source);
  const masked = maskUnrelatedStringLiterals(stripped);
  return jsxPropRegex(prop, id).test(masked);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function jsxPropRegex(prop: "courseId" | "checkId" | "lessonId", id: string): RegExp {
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
  prop: "courseId" | "checkId" | "lessonId",
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
  }
  return false;
}

function lessonIdInDataLiteral(source: string, lessonId: string): boolean {
  const stripped = stripComments(source);
  const escaped = escapeRegExp(lessonId);
  return new RegExp(`\\bid\\s*:\\s*["'\`]${escaped}["'\`]`).test(stripped);
}

function lessonIdPresent(source: string, lessonId: string): boolean {
  if (idPropPresent(source, "lessonId", lessonId)) return true;
  if (idUsedViaConstant(source, "lessonId", lessonId, extractStringConstants(source))) return true;
  return lessonIdInDataLiteral(source, lessonId);
}

function courseConfigCourseIdPresent(source: string, courseId: string): boolean {
  const stripped = stripComments(source);
  const escaped = escapeRegExp(courseId);
  const literalPattern = new RegExp(
    `(?<![A-Za-z0-9_$])courseId\\s*:\\s*(?:` +
      `"${escaped}"|'${escaped}'` +
      `)`,
  );
  if (literalPattern.test(stripped)) return true;
  return idUsedViaConstant(source, "courseId", courseId, extractStringConstants(source));
}

function courseIdPresent(source: string, courseId: string): boolean {
  if (idPropPresent(source, "courseId", courseId)) return true;
  if (idUsedViaConstant(source, "courseId", courseId, extractStringConstants(source))) return true;
  return courseConfigCourseIdPresent(source, courseId);
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
  const issues: ReactParityIssue[] = [];
  const customSourcesProvided = opts.appSources !== undefined;
  const appSources =
    opts.appSources ?? collectSourceUnderSrc(opts.projectRoot, issues);
  const source = readAppSources(
    opts.projectRoot,
    appSources,
    issues,
    customSourcesProvided,
  );
  const hasDescriptorIds =
    Boolean(opts.descriptor.courseId) || (opts.descriptor.assessments?.length ?? 0) > 0;

  if (!source.trim()) {
    issues.push({
      path: appSources.length > 0 ? appSources.join(", ") : "src/",
      message: hasDescriptorIds
        ? "React app source not found for ID parity check"
        : "React app source not found for ID parity check",
      severity: hasDescriptorIds ? "error" : "warning",
    });
    return issues;
  }

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

  for (const lesson of opts.descriptor.lessons ?? []) {
    const lessonId = lesson.id;
    if (!lessonId) continue;
    if (!lessonIdPresent(source, lessonId)) {
      issues.push({
        path: `lessons.id:${lessonId}`,
        message: parityHint(
          `React app source missing lessonId="${lessonId}" declared in lessonkit.json.`,
        ),
        severity: "error",
      });
    }
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

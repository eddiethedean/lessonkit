/** Minimal YAML emitter for LXPack course manifests (no extra dependency). */

function yamlQuote(value: string): string {
  if (/[:#\n\r]/.test(value) || value.startsWith(" ") || value.endsWith(" ")) {
    return JSON.stringify(value);
  }
  return value;
}

export function emitCourseYaml(opts: {
  title: string;
  version: string;
  description?: string;
  runtime?: { theme: string; cssVariables?: Record<string, string> };
  tracking?: { completion?: { threshold?: number } };
  lessons: Array<{ id: string; title: string; type: "spa"; path: string }>;
  assessments: Array<{ id: string; file: string }>;
}): string {
  const lines: string[] = [];
  lines.push(`title: ${yamlQuote(opts.title)}`);
  lines.push(`version: ${yamlQuote(opts.version)}`);
  if (opts.description) lines.push(`description: ${yamlQuote(opts.description)}`);

  if (opts.runtime) {
    lines.push("runtime:");
    lines.push(`  theme: ${yamlQuote(opts.runtime.theme)}`);
    if (opts.runtime.cssVariables && Object.keys(opts.runtime.cssVariables).length) {
      lines.push("  cssVariables:");
      for (const [key, value] of Object.entries(opts.runtime.cssVariables).sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        lines.push(`    ${key}: ${JSON.stringify(String(value))}`);
      }
    }
  }

  if (opts.tracking?.completion?.threshold !== undefined) {
    lines.push("tracking:");
    lines.push("  completion:");
    lines.push(`    threshold: ${opts.tracking.completion.threshold}`);
  }

  lines.push("lessons:");
  for (const lesson of opts.lessons) {
    lines.push(`  - id: ${lesson.id}`);
    lines.push(`    title: ${yamlQuote(lesson.title)}`);
    lines.push(`    type: spa`);
    lines.push(`    path: ${lesson.path}`);
  }

  if (opts.assessments.length) {
    lines.push("assessments:");
    for (const assessment of opts.assessments) {
      lines.push(`  - id: ${assessment.id}`);
      lines.push(`    file: ${assessment.file}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

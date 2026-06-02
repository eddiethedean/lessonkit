export function escapeJsxString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/"/g, '\\"');
}

export function jsxStringLiteral(value: string): string {
  return `"${escapeJsxString(value)}"`;
}

export function jsxStringArray(values: readonly string[]): string {
  return `[${values.map((v) => jsxStringLiteral(v)).join(", ")}]`;
}

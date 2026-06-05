/** Parses `*segment*` markers into alternating text parts and zone ids with answers. */
export function parseStarDelimitedTemplate(
  template: string,
  idPrefix: string,
): { parts: string[]; values: string[] } {
  const parts: string[] = [];
  const values: string[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let n = 0;
  while ((match = re.exec(template)) !== null) {
    parts.push(template.slice(last, match.index));
    values.push(match[1]!.trim());
    parts.push(`${idPrefix}-${n++}`);
    last = match.index + match[0].length;
  }
  parts.push(template.slice(last));
  return { parts, values };
}

export function formatDurationMs(ms: number): string | undefined {
  if (!Number.isFinite(ms) || ms < 0) return undefined;
  const safe = ms;
  // xAPI expects ISO 8601 duration. Use seconds with millisecond precision.
  const seconds = safe / 1000;
  const fixed = Number.isInteger(seconds)
    ? String(seconds)
    : seconds.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  return `PT${fixed}S`;
}


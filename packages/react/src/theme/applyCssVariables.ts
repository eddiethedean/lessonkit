/** Apply `--lk-*` variables to a DOM host; removes keys no longer present. */
export function applyCssVariables(
  target: HTMLElement,
  vars: Record<string, string>,
  previousKeys: Set<string>,
): Set<string> {
  for (const key of previousKeys) {
    if (!(key in vars)) {
      target.style.removeProperty(key);
    }
  }
  const nextKeys = new Set<string>();
  for (const [key, value] of Object.entries(vars)) {
    target.style.setProperty(key, value);
    nextKeys.add(key);
  }
  return nextKeys;
}

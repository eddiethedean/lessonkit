const DEFAULT_DROP_ATTR = "data-lk-drop-id";

export function resolveDropTargetAtPoint(
  clientX: number,
  clientY: number,
  attribute: string = DEFAULT_DROP_ATTR,
): string | null {
  if (typeof document === "undefined") return null;
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;
  const target = el.closest(`[${attribute}]`);
  if (!target) return null;
  return target.getAttribute(attribute);
}

export { DEFAULT_DROP_ATTR };

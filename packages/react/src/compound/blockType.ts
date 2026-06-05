import type { ComponentType } from "react";

export const LESSONKIT_BLOCK_TYPE = Symbol.for("lessonkit.blockType");

export function setLessonkitBlockType<P>(
  component: ComponentType<P>,
  blockType: string,
): ComponentType<P> {
  (component as ComponentType<P> & { [LESSONKIT_BLOCK_TYPE]?: string })[LESSONKIT_BLOCK_TYPE] =
    blockType;
  if (!component.displayName) {
    component.displayName = blockType;
  }
  return component;
}

export function getLessonkitBlockType(component: unknown): string | undefined {
  if (!component || (typeof component !== "object" && typeof component !== "function")) {
    return undefined;
  }
  const typed = component as { [LESSONKIT_BLOCK_TYPE]?: string; displayName?: string };
  return typed[LESSONKIT_BLOCK_TYPE] ?? typed.displayName;
}

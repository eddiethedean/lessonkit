import React from "react";
import { isChildTypeAllowed, type CompoundParentType } from "@lessonkit/core";
import { isDevEnvironment } from "../runtime/validateComponentId";
import { getLessonkitBlockType } from "./blockType";

const warnedPairs = new Set<string>();

export function validateCompoundChildren(
  parent: CompoundParentType,
  children: React.ReactNode,
  strict?: boolean,
): void {
  if (!isDevEnvironment() && !strict) return;

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const type = child.type;
    const blockType = getLessonkitBlockType(type);
    if (!blockType) return;
    if (!isChildTypeAllowed(parent, blockType)) {
      const key = `${parent}:${blockType}`;
      if (!warnedPairs.has(key)) {
        warnedPairs.add(key);
        const msg = `[lessonkit] Block "${blockType}" is not in the allowlist for "${parent}"`;
        if (strict) throw new Error(msg);
        console.warn(msg);
      }
    }
  });
}

/** @internal Reset dev warnings between tests. */
export function resetCompoundValidationWarningsForTests(): void {
  warnedPairs.clear();
}

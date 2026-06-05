import React from "react";
import {
  ACCORDION_FORBIDDEN_CHILD_TYPES,
  COMPOUND_MAX_NESTING_DEPTH,
  isChildTypeAllowed,
  type CompoundParentType,
} from "@lessonkit/core";
import { isDevEnvironment } from "../runtime/validateComponentId";
import { getLessonkitBlockType } from "./blockType";

const warnedPairs = new Set<string>();
const COMPOUND_CONTAINER_TYPES = new Set<CompoundParentType>([
  "Page",
  "InteractiveBook",
  "AssessmentSequence",
]);

function warnOrThrow(msg: string, strict?: boolean): void {
  if (strict) throw new Error(msg);
  if (!warnedPairs.has(msg)) {
    warnedPairs.add(msg);
    console.warn(msg);
  }
}

function validateNode(
  parent: CompoundParentType,
  node: React.ReactNode,
  depth: number,
  strict?: boolean,
): void {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    const blockType = getLessonkitBlockType(child.type);
    if (!blockType) {
      if (child.props && typeof child.props === "object" && "children" in child.props) {
        validateNode(parent, (child.props as { children?: React.ReactNode }).children, depth, strict);
      }
      return;
    }

    if (!isChildTypeAllowed(parent, blockType)) {
      const key = `${parent}:${blockType}`;
      if (!warnedPairs.has(key)) {
        warnedPairs.add(key);
        const msg = `[lessonkit] Block "${blockType}" is not in the allowlist for "${parent}"`;
        if (strict) throw new Error(msg);
        console.warn(msg);
      }
    }

    if (COMPOUND_CONTAINER_TYPES.has(blockType as CompoundParentType)) {
      const maxDepth = COMPOUND_MAX_NESTING_DEPTH[parent];
      if (depth >= maxDepth) {
        warnOrThrow(
          `[lessonkit] Block "${blockType}" exceeds max nesting depth (${maxDepth}) for "${parent}"`,
          strict,
        );
      }
      const nestedParent = blockType as CompoundParentType;
      validateNode(nestedParent, (child.props as { children?: React.ReactNode }).children, depth + 1, strict);
    } else if (blockType === "Accordion") {
      const sections = (child.props as { sections?: { content: React.ReactNode }[] }).sections;
      if (sections) validateAccordionSections(sections, strict);
    } else if (child.props && typeof child.props === "object" && "children" in child.props) {
      validateSubtreeForForbidden(
        (child.props as { children?: React.ReactNode }).children,
        ACCORDION_FORBIDDEN_CHILD_TYPES,
        strict,
      );
    }
  });
}

function validateSubtreeForForbidden(
  node: React.ReactNode,
  forbidden: readonly string[],
  strict?: boolean,
): void {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    const blockType = getLessonkitBlockType(child.type);
    if (blockType && forbidden.includes(blockType)) {
      warnOrThrow(`[lessonkit] Block "${blockType}" must not nest inside Accordion`, strict);
    }
    if (blockType === "Accordion") {
      const sections = (child.props as { sections?: { content: React.ReactNode }[] }).sections;
      if (sections) validateAccordionSections(sections, strict);
      return;
    }
    if (child.props && typeof child.props === "object" && "children" in child.props) {
      validateSubtreeForForbidden(
        (child.props as { children?: React.ReactNode }).children,
        forbidden,
        strict,
      );
    }
  });
}

export function validateAccordionSections(
  sections: { content: React.ReactNode }[],
  strict?: boolean,
): void {
  if (!isDevEnvironment() && !strict) return;
  for (const section of sections) {
    validateSubtreeForForbidden(section.content, ACCORDION_FORBIDDEN_CHILD_TYPES, strict);
  }
}

export function validateCompoundChildren(
  parent: CompoundParentType,
  children: React.ReactNode,
  strict?: boolean,
): void {
  if (!isDevEnvironment() && !strict) return;
  validateNode(parent, children, 0, strict);
}

/** @internal Reset dev warnings between tests. */
export function resetCompoundValidationWarningsForTests(): void {
  warnedPairs.clear();
}

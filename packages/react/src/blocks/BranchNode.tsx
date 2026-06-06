import React from "react";
import { setLessonkitBlockType } from "../compound/blockType";
import { CompoundPageIndexProvider } from "../compound/CompoundPageIndexContext";
import { filterBranchNodeContent } from "../compound/validateBranchGraph";
import { validateCompoundChildren } from "../compound/validateChildren";

export type BranchNodeProps = {
  nodeId: string;
  title?: string;
  /** When true, node is treated as an end state (no outgoing choices expected). */
  terminal?: boolean;
  /** When true, node is hidden until navigated (set by BranchingScenario). */
  hidden?: boolean;
  /** Index within BranchingScenario (set by parent). */
  nodeIndex?: number;
  children: React.ReactNode;
};

export function BranchNode(props: BranchNodeProps) {
  validateCompoundChildren("BranchNode", filterBranchNodeContent(props.children));

  return (
    <section
      aria-label={props.title ?? props.nodeId}
      data-lk-node-id={props.nodeId}
      data-testid={`branch-node-${props.nodeId}`}
      hidden={props.hidden ? true : undefined}
      style={props.hidden ? { display: "none" } : undefined}
    >
      {props.title ? <h4>{props.title}</h4> : null}
      <CompoundPageIndexProvider pageIndex={props.nodeIndex ?? 0}>
        <div>{props.children}</div>
      </CompoundPageIndexProvider>
    </section>
  );
}

setLessonkitBlockType(BranchNode, "BranchNode");

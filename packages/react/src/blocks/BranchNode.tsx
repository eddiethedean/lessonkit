import React from "react";
import { getLessonkitBlockType, setLessonkitBlockType } from "../compound/blockType";
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
  /** When true, this node is the active step (set by BranchingScenario). */
  isActive?: boolean;
  /** Index within BranchingScenario (set by parent). */
  nodeIndex?: number;
  children: React.ReactNode;
};

export function BranchNode(props: BranchNodeProps) {
  validateCompoundChildren("BranchNode", filterBranchNodeContent(props.children));

  const classNames = [
    "lk-branch-node",
    props.isActive ? "lk-branch-node--active" : "",
    props.terminal ? "lk-branch-node--terminal" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content: React.ReactNode[] = [];
  const choices: React.ReactNode[] = [];

  React.Children.forEach(props.children, (child) => {
    if (!React.isValidElement(child)) {
      content.push(child);
      return;
    }
    if (getLessonkitBlockType(child.type) === "BranchChoice") {
      choices.push(child);
      return;
    }
    content.push(child);
  });

  const choiceGroupLabel = props.title ? `Choices for ${props.title}` : `Choices for ${props.nodeId}`;

  return (
    <section
      className={classNames}
      aria-label={props.title ?? props.nodeId}
      data-lk-node-id={props.nodeId}
      data-testid={`branch-node-${props.nodeId}`}
      hidden={props.hidden ? true : undefined}
      style={props.hidden ? { display: "none" } : undefined}
    >
      {props.title ? <h4>{props.title}</h4> : null}
      <CompoundPageIndexProvider pageIndex={props.nodeIndex ?? 0}>
        {content.length > 0 ? <div>{content}</div> : null}
        {choices.length > 0 && props.isActive ? (
          <div className="lk-branch-choices" role="radiogroup" aria-label={choiceGroupLabel}>
            {choices}
          </div>
        ) : choices.length > 0 ? (
          <div className="lk-branch-choices">{choices}</div>
        ) : null}
      </CompoundPageIndexProvider>
    </section>
  );
}

setLessonkitBlockType(BranchNode, "BranchNode");

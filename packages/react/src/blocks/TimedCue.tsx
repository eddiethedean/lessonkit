import React from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { CompoundPageIndexProvider } from "../compound/CompoundPageIndexContext";
import { validateCompoundChildren } from "../compound/validateChildren";

export type TimedCueProps = {
  atSeconds: number;
  label?: string;
  mustComplete?: boolean;
  /** Set by InteractiveVideo when cue is not active. */
  hidden?: boolean;
  cueIndex?: number;
  parentType?: string;
  children: React.ReactElement;
};

export function TimedCue(props: TimedCueProps) {
  validateCompoundChildren("TimedCue", props.children, true);
  const child = React.Children.only(props.children);

  if (props.hidden) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label={props.label ?? `Interaction at ${props.atSeconds} seconds`}
      data-testid={`timed-cue-${props.cueIndex ?? 0}`}
      data-lk-cue-at={props.atSeconds}
      className="lk-timed-cue-overlay"
      style={{
        position: "relative",
        zIndex: 2,
        background: "var(--lk-surface, #fff)",
        padding: "1rem",
        border: "1px solid var(--lk-border, #ccc)",
        marginTop: "0.5rem",
      }}
    >
      {props.label ? <p data-testid="timed-cue-label">{props.label}</p> : null}
      <CompoundPageIndexProvider pageIndex={props.cueIndex ?? 0}>
        {child}
      </CompoundPageIndexProvider>
    </div>
  );
}

setLessonkitBlockType(TimedCue, "TimedCue");

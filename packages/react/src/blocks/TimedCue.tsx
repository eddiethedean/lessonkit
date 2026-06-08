import React, { useEffect, useRef } from "react";
import { trapFocus } from "@lessonkit/accessibility";
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
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.hidden || !overlayRef.current) return;
    const trap = trapFocus(overlayRef.current, { restoreFocus: false });
    trap.activate();
    const firstFocusable = overlayRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
    return () => trap.deactivate();
  }, [props.hidden, props.cueIndex]);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal={props.hidden ? undefined : true}
      aria-hidden={props.hidden ? true : undefined}
      hidden={props.hidden ? true : undefined}
      aria-label={props.label ?? `Interaction at ${props.atSeconds} seconds`}
      data-testid={`timed-cue-${props.cueIndex ?? 0}`}
      data-lk-cue-at={props.atSeconds}
      className="lk-timed-cue-overlay"
    >
      {props.hidden ? null : props.label ? (
        <p className="lk-timed-cue-label" data-testid="timed-cue-label">
          {props.label}
        </p>
      ) : null}
      <CompoundPageIndexProvider pageIndex={props.cueIndex ?? 0}>
        {child}
      </CompoundPageIndexProvider>
    </div>
  );
}

setLessonkitBlockType(TimedCue, "TimedCue");

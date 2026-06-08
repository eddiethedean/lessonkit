import React from "react";
import { setLessonkitBlockType } from "../compound/blockType";
import { CompoundPageIndexProvider } from "../compound/CompoundPageIndexContext";
import { filterMapStageContent } from "../compound/validateMapGraph";
import { validateCompoundChildren } from "../compound/validateChildren";

export type MapStageProps = {
  stageId: string;
  x: number;
  y: number;
  label?: string;
  hidden?: boolean;
  stageIndex?: number;
  children: React.ReactNode;
};

export function MapStage(props: MapStageProps) {
  validateCompoundChildren("MapStage", filterMapStageContent(props.children));

  return (
    <section
      aria-label={props.label ?? props.stageId}
      data-lk-stage-id={props.stageId}
      data-testid={`map-stage-${props.stageId}`}
      hidden={props.hidden ? true : undefined}
      style={props.hidden ? { display: "none" } : undefined}
    >
      {props.label ? <h4>{props.label}</h4> : null}
      <CompoundPageIndexProvider pageIndex={props.stageIndex ?? 0}>
        <div>{props.children}</div>
      </CompoundPageIndexProvider>
    </section>
  );
}

setLessonkitBlockType(MapStage, "MapStage");

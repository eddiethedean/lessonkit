import React, { useEffect, useMemo } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type ChartDatum = {
  label: string;
  value: number;
};

export type ChartProps = {
  blockId: BlockId;
  type: "bar" | "pie";
  data: ChartDatum[];
  title?: string;
};

export function Chart(props: ChartProps) {
  const blockId = normalizeComponentId(props.blockId, "blockId") as BlockId;
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const max = useMemo(() => Math.max(...props.data.map((d) => d.value), 1), [props.data]);

  useEffect(() => {
    track(
      "interaction",
      { kind: "chart_viewed", blockId, chartType: props.type },
      lessonId ? { lessonId } : undefined,
    );
  }, [blockId, lessonId, props.type, track]);

  return (
    <figure data-lk-block-id={blockId} data-testid={`chart-${blockId}`}>
      {props.title ? <figcaption>{props.title}</figcaption> : null}
      {props.type === "bar" ? (
        <div role="img" aria-label={props.title ?? "Bar chart"}>
          {props.data.map((datum) => (
            <div key={datum.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ minWidth: "6rem" }}>{datum.label}</span>
              <div
                style={{
                  height: "1rem",
                  width: `${(datum.value / max) * 100}%`,
                  background: "var(--lk-color-primary, #2563eb)",
                }}
                aria-hidden
              />
              <span>{datum.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <ul role="list" aria-label={props.title ?? "Pie chart segments"}>
          {props.data.map((datum) => (
            <li key={datum.label}>
              {datum.label}: {datum.value}
            </li>
          ))}
        </ul>
      )}
      <table>
        <caption>{props.title ?? "Chart data"}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {props.data.map((datum) => (
            <tr key={datum.label}>
              <th scope="row">{datum.label}</th>
              <td>{datum.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

setLessonkitBlockType(Chart, "Chart");

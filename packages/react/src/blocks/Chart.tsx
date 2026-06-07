import React, { useEffect, useMemo } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";
import { chartMaxValue, normalizeChartData, normalizeChartType } from "./chartUtils";

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
  const chartType = normalizeChartType(props.type);
  const rows = useMemo(() => normalizeChartData(props.data), [props.data]);
  const max = useMemo(() => chartMaxValue(rows), [rows]);

  useEffect(() => {
    track(
      "interaction",
      { kind: "chart_viewed", blockId, chartType },
      lessonId ? { lessonId } : undefined,
    );
  }, [blockId, chartType, lessonId, track]);

  return (
    <figure data-lk-block-id={blockId} data-testid={`chart-${blockId}`}>
      {props.title ? <figcaption>{props.title}</figcaption> : null}
      {rows.length === 0 ? (
        <p data-testid="chart-empty">No chart data.</p>
      ) : chartType === "table" ? null : chartType === "bar" ? (
        <div role="img" aria-label={props.title ?? "Bar chart"} aria-describedby={`${blockId}-table`}>
          {rows.map((datum) => (
            <div key={datum.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
          {rows.map((datum) => (
            <li key={datum.key}>
              {datum.label}: {datum.value}
            </li>
          ))}
        </ul>
      )}
      <table id={`${blockId}-table`}>
        <caption>{props.title ?? "Chart data"}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((datum) => (
            <tr key={datum.key}>
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

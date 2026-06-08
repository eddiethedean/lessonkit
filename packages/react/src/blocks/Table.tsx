import React, { useMemo } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type TableProps = {
  blockId: BlockId;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export function Table(props: TableProps) {
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );

  return (
    <section aria-label={props.caption ?? "Table"} data-lk-block-id={blockId} data-testid="table-block">
      <div style={{ overflowX: "auto" }}>
        <table>
          {props.caption ? <caption>{props.caption}</caption> : null}
          <thead>
            <tr>
              {props.headers.map((header, index) => (
                <th key={`h-${index}`} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, rowIndex) => (
              <tr key={`r-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`c-${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

setLessonkitBlockType(Table, "Table");

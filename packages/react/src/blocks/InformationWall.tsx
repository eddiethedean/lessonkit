import React, { useMemo, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";

export type InformationPanel = {
  id: string;
  title: string;
  body: string;
};

export type InformationWallProps = {
  blockId: BlockId;
  panels: InformationPanel[];
};

export function InformationWall(props: InformationWallProps) {
  const [query, setQuery] = useState("");
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const trackOpts = lessonId ? { lessonId } : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.panels;
    return props.panels.filter(
      (panel) =>
        panel.title.toLowerCase().includes(q) || panel.body.toLowerCase().includes(q),
    );
  }, [props.panels, query]);

  const onSearch = (value: string) => {
    setQuery(value);
    const q = value.trim().toLowerCase();
    const resultCount = q
      ? props.panels.filter(
          (panel) =>
            panel.title.toLowerCase().includes(q) || panel.body.toLowerCase().includes(q),
        ).length
      : props.panels.length;
    track(
      "information_wall_search",
      { blockId: props.blockId, query: value, resultCount },
      trackOpts,
    );
  };

  return (
    <section aria-label="Information Wall" data-lk-block-id={props.blockId} data-testid="information-wall">
      <label htmlFor={`${props.blockId}-search`}>Search panels</label>
      <input
        id={`${props.blockId}-search`}
        type="search"
        data-testid="information-wall-search"
        value={query}
        placeholder="Search…"
        onChange={(e) => onSearch(e.target.value)}
      />
      <p data-testid="information-wall-result-count">
        {filtered.length} panel{filtered.length === 1 ? "" : "s"}
      </p>
      <ul data-testid="information-wall-panels">
        {filtered.map((panel) => (
          <li key={panel.id} data-testid={`information-panel-${panel.id}`}>
            <h4>{panel.title}</h4>
            <p>{panel.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

setLessonkitBlockType(InformationWall, "InformationWall");

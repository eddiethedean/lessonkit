import React, { useEffect, useMemo, useRef, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";

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
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const [query, setQuery] = useState("");
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const trackOpts = lessonId ? { lessonId } : undefined;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.panels;
    return props.panels.filter(
      (panel) =>
        panel.title.toLowerCase().includes(q) || panel.body.toLowerCase().includes(q),
    );
  }, [props.panels, query]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const onSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = value.trim().toLowerCase();
      const resultCount = q
        ? props.panels.filter(
            (panel) =>
              panel.title.toLowerCase().includes(q) || panel.body.toLowerCase().includes(q),
          ).length
        : props.panels.length;
      track(
        "information_wall_search",
        { blockId, query: value, resultCount },
        trackOpts,
      );
    }, 300);
  };

  return (
    <section aria-label="Information Wall" data-lk-block-id={blockId} data-testid="information-wall">
      <label htmlFor={`${blockId}-search`}>Search panels</label>
      <input
        id={`${blockId}-search`}
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

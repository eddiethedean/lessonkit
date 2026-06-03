import React from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { validateCompoundChildren } from "../compound/validateChildren";

export type PageProps = {
  blockId: BlockId;
  title?: string;
  /** When true, page is used as a book chapter but hidden until navigated (InteractiveBook). */
  hidden?: boolean;
  children: React.ReactNode;
};

export function Page(props: PageProps) {
  validateCompoundChildren("Page", props.children);
  return (
    <section
      aria-label={props.title ?? "Page"}
      data-lk-block-id={props.blockId}
      data-testid={`page-${props.blockId}`}
      hidden={props.hidden ? true : undefined}
    >
      {props.title ? <h3>{props.title}</h3> : null}
      <div>{props.children}</div>
    </section>
  );
}

setLessonkitBlockType(Page, "Page");

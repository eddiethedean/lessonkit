import React, { useId, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { validateAccordionSections } from "../compound/validateChildren";
import { isDevEnvironment } from "../runtime/validateComponentId";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";

export type AccordionSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

export type AccordionProps = {
  blockId: BlockId;
  sections: AccordionSection[];
};

export function Accordion(props: AccordionProps) {
  if (isDevEnvironment()) {
    validateAccordionSections(props.sections);
  }

  const [open, setOpen] = useState<Set<string>>(new Set());
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const baseId = useId();

  const toggle = (sectionId: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      const expanded = !next.has(sectionId);
      if (expanded) next.add(sectionId);
      else next.delete(sectionId);
      track(
        "accordion_section_toggled",
        { blockId: props.blockId, sectionId, expanded },
        lessonId ? { lessonId } : undefined,
      );
      return next;
    });
  };

  return (
    <section aria-label="Accordion" data-lk-block-id={props.blockId} data-testid="accordion">
      {props.sections.map((section) => {
        const expanded = open.has(section.id);
        const panelId = `${baseId}-${section.id}`;
        const triggerId = `${baseId}-trigger-${section.id}`;
        return (
          <div key={section.id} data-testid={`accordion-section-${section.id}`}>
            <h4>
              <button
                id={triggerId}
                type="button"
                className="lk-button lk-accordion-trigger"
                aria-expanded={expanded}
                aria-controls={panelId}
                data-testid={`accordion-trigger-${section.id}`}
                onClick={() => toggle(section.id)}
              >
                {section.title}
              </button>
            </h4>
            {expanded ? (
              <div id={panelId} role="region" aria-labelledby={triggerId}>
                {section.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

setLessonkitBlockType(Accordion, "Accordion");

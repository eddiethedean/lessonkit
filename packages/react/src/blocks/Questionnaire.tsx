import React, { useEffect, useId, useMemo, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type QuestionnaireField = {
  id: string;
  label: string;
  type: "text" | "textarea";
};

export type QuestionnaireProps = {
  blockId: BlockId;
  fields: QuestionnaireField[];
};

export function Questionnaire(props: QuestionnaireProps) {
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const fieldsKey = props.fields.map((f) => `${f.id}:${f.type}:${f.label}`).join("|");
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(props.fields.map((f) => [f.id, ""])),
  );
  const [submitted, setSubmitted] = useState(false);
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const baseId = useId();

  useEffect(() => {
    setValues(Object.fromEntries(props.fields.map((f) => [f.id, ""])));
    setSubmitted(false);
  }, [blockId, fieldsKey, props.fields]);

  const submit = () => {
    if (submitted) return;
    setSubmitted(true);
    if (lessonId) {
      track(
        "questionnaire_submitted",
        { blockId, fieldCount: props.fields.length },
        { lessonId },
      );
    }
  };

  return (
    <section aria-label="Questionnaire" data-lk-block-id={blockId} data-testid="questionnaire">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {props.fields.map((field) => {
          const fieldId = `${baseId}-${field.id}`;
          return (
            <div key={field.id} data-testid={`questionnaire-field-${field.id}`}>
              <label htmlFor={fieldId}>{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  id={fieldId}
                  data-testid={`questionnaire-input-${field.id}`}
                  value={values[field.id] ?? ""}
                  disabled={submitted}
                  rows={4}
                  style={{ display: "block", width: "100%" }}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                />
              ) : (
                <input
                  id={fieldId}
                  type="text"
                  data-testid={`questionnaire-input-${field.id}`}
                  value={values[field.id] ?? ""}
                  disabled={submitted}
                  style={{ display: "block", width: "100%" }}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                />
              )}
            </div>
          );
        })}
        <button type="submit" data-testid="questionnaire-submit" disabled={submitted}>
          Submit
        </button>
      </form>
      {submitted ? (
        <p role="status" aria-live="polite" data-testid="questionnaire-submitted">
          Thank you for your responses.
        </p>
      ) : null}
    </section>
  );
}

setLessonkitBlockType(Questionnaire, "Questionnaire");

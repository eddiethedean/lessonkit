import React, { useImperativeHandle } from "react";
import type { AssessmentHandle, CheckId } from "@lessonkit/core";
import { useRegisterAssessmentHandle } from "../AssessmentSequenceContext";

/** Wires imperative ref + compound registry for an assessment block handle. */
export function useAssessmentHandleRegistration(
  checkId: CheckId,
  handle: AssessmentHandle,
  ref: React.Ref<AssessmentHandle>,
): void {
  useImperativeHandle(ref, () => handle, [handle]);
  useRegisterAssessmentHandle(checkId, handle);
};

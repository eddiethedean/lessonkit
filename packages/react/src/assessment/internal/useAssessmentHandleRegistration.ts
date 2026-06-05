import React, { useImperativeHandle } from "react";
import type { AssessmentHandle, CheckId } from "@lessonkit/core";
import { useRegisterAssessmentHandle } from "../AssessmentSequenceContext";

/**
 * Wires imperative ref + compound registry for an assessment block handle.
 * Compound persistence saves when the registered handle identity changes; blocks with
 * stable handles must recreate the handle (or bump registry version) on each answer change.
 */
export function useAssessmentHandleRegistration(
  checkId: CheckId,
  handle: AssessmentHandle,
  ref: React.Ref<AssessmentHandle>,
): void {
  useImperativeHandle(ref, () => handle, [handle]);
  useRegisterAssessmentHandle(checkId, handle);
};

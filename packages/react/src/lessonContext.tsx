import { createContext, useContext } from "react";
import type { LessonId } from "@lessonkit/core";

export const LessonContext = createContext<LessonId | undefined>(undefined);

export function useEnclosingLessonId(): LessonId | undefined {
  return useContext(LessonContext);
}

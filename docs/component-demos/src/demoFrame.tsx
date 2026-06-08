import type { ReactNode } from "react";
import { DemoIntro } from "./DemoIntro";
import { DemoShell } from "./DemoShell";
import { DEMO_INTROS } from "./demoIntros";

export function demoFrame(
  slug: string,
  lessonTitle: string,
  children: ReactNode,
  intro?: string,
): ReactNode {
  const introText = intro ?? DEMO_INTROS[slug];
  return (
    <DemoShell courseId={`demo-${slug}`} lessonId={`${slug}-lesson`} lessonTitle={lessonTitle}>
      {introText ? <DemoIntro>{introText}</DemoIntro> : null}
      {children}
    </DemoShell>
  );
}

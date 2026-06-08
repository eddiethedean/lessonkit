import type { ReactNode } from "react";

export function DemoIntro({ children }: { children: ReactNode }) {
  return <p className="lk-demo-intro">{children}</p>;
}

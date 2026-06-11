import type { ReactNode } from "react";

export type TouchHintProps = {
  children: ReactNode;
};

export function TouchHint({ children }: TouchHintProps) {
  return (
    <p className="lk-touch-hint" role="status">
      {children}
    </p>
  );
}

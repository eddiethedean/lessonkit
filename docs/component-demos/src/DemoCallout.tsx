import type { ReactNode } from "react";

export type DemoCalloutProps = {
  children: ReactNode;
  relatedSlug?: string;
  relatedLabel?: string;
};

export function DemoCallout({ children, relatedSlug, relatedLabel }: DemoCalloutProps) {
  return (
    <aside className="lk-demo-callout" role="note">
      <div className="lk-demo-callout-body">{children}</div>
      {relatedSlug && relatedLabel ? (
        <p className="lk-demo-callout-link">
          <a href={`#/${relatedSlug}`}>{relatedLabel}</a>
        </p>
      ) : null}
    </aside>
  );
}

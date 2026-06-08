import type { ReactNode } from "react";

export type ComponentDemo = {
  slug: string;
  title: string;
  render: () => ReactNode;
};

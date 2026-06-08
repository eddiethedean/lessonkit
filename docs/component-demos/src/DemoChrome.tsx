import type { ReactNode } from "react";
import { ThemeProvider } from "@lessonkit/react";
import { ThemeToggle, useThemeMode } from "../../../examples/_shared/theme-ui";

export function DemoChrome({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useThemeMode();

  return (
    <ThemeProvider mode={themeMode} preset="brand">
      <div className="lk-example-shell">
        <div className="lk-example-theme-bar">
          <ThemeToggle mode={themeMode} onChange={setThemeMode} />
        </div>
        {children}
      </div>
    </ThemeProvider>
  );
}

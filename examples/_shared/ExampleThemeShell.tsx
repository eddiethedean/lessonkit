import type { ReactNode } from "react";
import { ThemeProvider } from "@lessonkit/react";
import { ThemeToggle, useThemeMode } from "./theme-ui";

export function ExampleThemeShell(props: { children: ReactNode; className?: string }) {
  const [themeMode, setThemeMode] = useThemeMode();

  return (
    <ThemeProvider mode={themeMode} preset="brand">
      <div className={["lk-example-shell", props.className].filter(Boolean).join(" ")}>
        <div className="lk-example-theme-bar">
          <ThemeToggle mode={themeMode} onChange={setThemeMode} />
        </div>
        {props.children}
      </div>
    </ThemeProvider>
  );
}

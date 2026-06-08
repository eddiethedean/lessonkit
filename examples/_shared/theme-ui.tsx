import React from "react";
import type { ThemeMode } from "@lessonkit/react";
import { initialShowcaseThemeMode } from "./showcase/initialThemeMode";

export function useThemeMode(initial?: ThemeMode): [ThemeMode, React.Dispatch<React.SetStateAction<ThemeMode>>] {
  return React.useState<ThemeMode>(initial ?? initialShowcaseThemeMode());
}

export function ThemeToggle(props: {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  className?: string;
}) {
  const className = ["lms-theme-toggle", props.className].filter(Boolean).join(" ");
  return (
    <div className={className} role="group" aria-label="Display theme">
      {(["light", "dark", "system"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={props.mode === m}
          className={props.mode === m ? "lms-outline-active" : undefined}
          onClick={() => props.onChange(m)}
        >
          {m === "system" ? "System" : m === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </div>
  );
}

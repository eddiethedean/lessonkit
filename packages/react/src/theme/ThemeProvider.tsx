import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  darkTheme,
  getPresetTheme,
  lightTheme,
  mergeThemes,
  themeToCssVariables,
  type LessonkitThemeV1,
  type PartialLessonkitThemeV1,
  type ThemePresetName,
} from "@lessonkit/themes";
import { applyCssVariables } from "./applyCssVariables";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeResolvedMode = "light" | "dark";

export type ThemeProviderProps = {
  children: React.ReactNode;
  /** Partial theme merged on top of the resolved preset (last writer wins). */
  theme?: PartialLessonkitThemeV1;
  preset?: ThemePresetName;
  mode?: ThemeMode;
  /** `document` injects on `:root`; `element` scopes to the provider wrapper. */
  target?: "document" | "element";
};

export type ThemeContextValue = {
  theme: LessonkitThemeV1;
  preset: ThemePresetName;
  mode: ThemeMode;
  resolvedMode: ThemeResolvedMode;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : React.useEffect;

function getSystemMode(): ThemeResolvedMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveModeBase(mode: ThemeMode, resolvedMode: ThemeResolvedMode): LessonkitThemeV1 {
  if (mode === "system") {
    return resolvedMode === "dark" ? darkTheme : lightTheme;
  }
  if (mode === "dark") return darkTheme;
  return lightTheme;
}

export function ThemeProvider(props: ThemeProviderProps) {
  const preset = props.preset ?? "default";
  const mode = props.mode ?? "light";
  const targetKind = props.target ?? "document";

  const [resolvedMode, setResolvedMode] = useState<ThemeResolvedMode>(() =>
    mode === "system" ? getSystemMode() : mode,
  );

  useIsoLayoutEffect(() => {
    if (mode !== "system") {
      setResolvedMode(mode);
      return;
    }
    setResolvedMode(getSystemMode());
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedMode(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const dataTheme: ThemeResolvedMode =
    mode === "system" ? resolvedMode : mode === "dark" ? "dark" : "light";

  const effectiveTheme = useMemo(() => {
    const modeBase = resolveModeBase(mode, dataTheme);
    const base =
      preset === "default" ? modeBase : mergeThemes(modeBase, getPresetTheme(preset));
    return mergeThemes(base, props.theme ?? {});
  }, [preset, mode, dataTheme, props.theme]);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const appliedKeysRef = useRef<Set<string>>(new Set());

  useIsoLayoutEffect(() => {
    if (targetKind === "document" && typeof document !== "undefined") {
      document.documentElement.setAttribute("data-lk-theme", dataTheme);
      return () => document.documentElement.removeAttribute("data-lk-theme");
    }
  }, [targetKind, dataTheme]);

  const inject = useCallback(() => {
    const vars = themeToCssVariables(effectiveTheme);
    const el =
      targetKind === "document" && typeof document !== "undefined"
        ? document.documentElement
        : hostRef.current;
    if (!el) return;
    appliedKeysRef.current = applyCssVariables(el, vars, appliedKeysRef.current);
  }, [effectiveTheme, targetKind]);

  useIsoLayoutEffect(() => {
    inject();
    return () => {
      const el =
        targetKind === "document" && typeof document !== "undefined"
          ? document.documentElement
          : hostRef.current;
      if (!el) return;
      for (const key of appliedKeysRef.current) {
        el.style.removeProperty(key);
      }
      appliedKeysRef.current = new Set();
    };
  }, [inject, targetKind]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: effectiveTheme,
      preset,
      mode,
      resolvedMode: dataTheme,
    }),
    [effectiveTheme, preset, mode, dataTheme],
  );

  if (targetKind === "document") {
    return (
      <ThemeContext.Provider value={value}>
        <div data-lk-theme={dataTheme} style={{ display: "contents" }}>
          {props.children}
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      <div ref={hostRef} data-lk-theme={dataTheme}>
        {props.children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

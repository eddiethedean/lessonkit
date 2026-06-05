import { describe, expect, it } from "vitest";
import {
  brandTheme,
  brandThemeOverrides,
  buildThemeCatalog,
  colorExtraVarName,
  colorVarName,
  darkTheme,
  defaultTheme,
  getPresetTheme,
  lightTheme,
  mergeThemes,
  radiusVarName,
  sanitizeCssCustomPropertyValue,
  shadowVarName,
  spacingVarName,
  themeToCssDeclarationBlock,
  themeToCssVariables,
  tokenKeyToKebab,
  typographyVarName,
  validateTheme,
} from "../src";
import catalogJson from "../theme-catalog.v1.json";

const catalog = catalogJson as {
  schemaVersion: number;
  entries: ReturnType<typeof buildThemeCatalog>;
};

describe("@lessonkit/themes", () => {
  it("exports presets that validate", () => {
    for (const theme of [defaultTheme, lightTheme, darkTheme, brandTheme]) {
      const result = validateTheme(theme);
      expect(result.ok).toBe(true);
    }
  });

  it("validateTheme rejects incomplete themes", () => {
    const result = validateTheme({ name: "x", colors: {} });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });

  it("validateTheme rejects non-objects and invalid extras", () => {
    expect(validateTheme(null).ok).toBe(false);
    expect(validateTheme([]).ok).toBe(false);
    const unknownRoot = validateTheme({ ...defaultTheme, typo: true });
    expect(unknownRoot.ok).toBe(false);
    if (!unknownRoot.ok) {
      expect(unknownRoot.issues.some((i) => i.message === "unknown property")).toBe(true);
    }
    const unknownColorKey = validateTheme({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, typo: "#000" },
    });
    expect(unknownColorKey.ok).toBe(false);
    const missingName = validateTheme({ ...defaultTheme, name: "" });
    expect(missingName.ok).toBe(false);
    const badExtra = validateTheme({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, extra: { bad: "" } },
    });
    expect(badExtra.ok).toBe(false);
    const badExtraType = validateTheme({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, extra: [] },
    });
    expect(badExtraType.ok).toBe(false);
    const goodExtra = validateTheme({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, extra: { accent: "#00ff00" } },
    });
    expect(goodExtra.ok).toBe(true);
    const emptyExtra = validateTheme({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, extra: {} },
    });
    expect(emptyExtra.ok).toBe(true);
    if (emptyExtra.ok) {
      expect(emptyExtra.theme.colors.extra).toBeUndefined();
    }
  });

  it("validateTheme rejects invalid nested groups and unknown keys", () => {
    for (const colors of [null, []]) {
      const result = validateTheme({ ...defaultTheme, colors });
      expect(result.ok).toBe(false);
    }
    for (const spacing of [null, [], { ...defaultTheme.spacing, typo: "1px" }]) {
      const result = validateTheme({ ...defaultTheme, spacing });
      expect(result.ok).toBe(false);
    }
    for (const typography of [null, [], { ...defaultTheme.typography, typo: "x" }]) {
      const result = validateTheme({ ...defaultTheme, typography });
      expect(result.ok).toBe(false);
    }
    for (const radius of [null, [], { ...defaultTheme.radius, typo: "1px" }]) {
      const result = validateTheme({ ...defaultTheme, radius });
      expect(result.ok).toBe(false);
    }
    for (const shadows of [null, [], { ...defaultTheme.shadows, typo: "x" }]) {
      const result = validateTheme({ ...defaultTheme, shadows });
      expect(result.ok).toBe(false);
    }
    for (const key of ["", "   ", 0, null] as const) {
      const result = validateTheme({
        ...defaultTheme,
        colors: { ...defaultTheme.colors, primary: key as unknown as string },
      });
      expect(result.ok).toBe(false);
    }
  });

  it("getPresetTheme returns each preset", () => {
    expect(getPresetTheme("default").name).toBe("default");
    expect(getPresetTheme("light").name).toBe("light");
    expect(getPresetTheme("dark").name).toBe("dark");
    expect(getPresetTheme("brand").name).toBe("brand");
  });

  it("brandTheme merges overrides onto dark; brand+light mode keeps light background", () => {
    expect(brandTheme.colors.primary).toBe("#7c3aed");
    expect(brandTheme.colors.background).toBe(darkTheme.colors.background);
    const lightBrand = mergeThemes(lightTheme, brandThemeOverrides);
    expect(lightBrand.colors.background).toBe("#f7f8ff");
    expect(lightBrand.colors.primary).toBe("#7c3aed");
  });

  it("mergeThemes applies overrides last", () => {
    const merged = mergeThemes(defaultTheme, {
      colors: { primary: "#ff0000" },
    });
    expect(merged.colors.primary).toBe("#ff0000");
    expect(merged.colors.background).toBe(defaultTheme.colors.background);
  });

  it("mergeThemes deep-merges colors.extra", () => {
    const base = mergeThemes(defaultTheme, { colors: { extra: { foo: "1" } } });
    const merged = mergeThemes(base, { colors: { extra: { bar: "2" } } });
    expect(merged.colors.extra).toEqual({ foo: "1", bar: "2" });
  });

  it("mergeThemes skips falsy overrides and merges spacing", () => {
    const merged = mergeThemes(defaultTheme, undefined, { spacing: { md: "20px" } });
    expect(merged.spacing.md).toBe("20px");
  });

  it("themeToCssDeclarationBlock emits selector block", () => {
    const block = themeToCssDeclarationBlock(defaultTheme, { selector: ".app" });
    expect(block).toContain(".app {");
    expect(block).toContain("--lk-color-primary: #2563eb;");
    expect(themeToCssDeclarationBlock(defaultTheme)).toContain(":root {");
  });

  it("themeToCssVariables produces stable sorted keys", () => {
    const vars = themeToCssVariables(defaultTheme);
    const keys = Object.keys(vars);
    expect(keys).toEqual([...keys].sort());
    expect(vars["--lk-color-primary"]).toBe("#2563eb");
  });

  it("themeToCssVariables maps extension colors", () => {
    const vars = themeToCssVariables(darkTheme);
    expect(vars["--lk-color-extra-accent"]).toBe("#22d3ee");
  });

  it("themeToCssVariables skips non-object colors.extra", () => {
    const theme = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, extra: "not-an-object" as unknown as Record<string, string> },
    };
    const vars = themeToCssVariables(theme);
    expect(Object.keys(vars).some((k) => k.includes("extra"))).toBe(false);
  });

  it("css variable helpers kebab-case camelCase keys", () => {
    expect(tokenKeyToKebab("fontSizeBase")).toBe("font-size-base");
    expect(colorVarName("primary")).toBe("--lk-color-primary");
    expect(colorExtraVarName("accent")).toBe("--lk-color-extra-accent");
    expect(spacingVarName("md")).toBe("--lk-space-md");
    expect(typographyVarName("fontFamily")).toBe("--lk-font-family");
    expect(radiusVarName("sm")).toBe("--lk-radius-sm");
    expect(shadowVarName("lg")).toBe("--lk-shadow-lg");
  });

  it("sanitizeCssCustomPropertyValue rejects CSS-breaking values", () => {
    expect(sanitizeCssCustomPropertyValue("#2563eb")).toBe("#2563eb");
    expect(sanitizeCssCustomPropertyValue("red; } body { background: red")).toBeNull();
    expect(sanitizeCssCustomPropertyValue("value\nbreak")).toBeNull();
    expect(sanitizeCssCustomPropertyValue("/* comment */")).toBeNull();
  });

  it("validateTheme rejects unsafe token values and invalid extra keys", () => {
    const unsafePrimary = validateTheme({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, primary: "red; } body { background: red" },
    });
    expect(unsafePrimary.ok).toBe(false);

    const badExtraKey = validateTheme({
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        extra: { "bad key": "#fff" },
      },
    });
    expect(badExtraKey.ok).toBe(false);
  });

  it("themeToCssDeclarationBlock omits unsafe values", () => {
    const theme = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, primary: "red; } body { background: red" },
    };
    const block = themeToCssDeclarationBlock(theme);
    expect(block).not.toContain("body { background");
    expect(block).not.toContain("--lk-color-primary:");
  });

  it("buildThemeCatalog includes color-extra entry", () => {
    const entries = buildThemeCatalog();
    expect(entries.some((e) => e.type === "color-extra")).toBe(true);
  });

  it("theme-catalog.v1.json matches buildThemeCatalog()", () => {
    expect(catalog.schemaVersion).toBe(1);
    expect(catalog.entries).toEqual(buildThemeCatalog());
  });
});

describe("@lessonkit/themes snapshots", () => {
  it("defaultTheme css variables", () => {
    expect(themeToCssVariables(defaultTheme)).toMatchSnapshot();
  });
});

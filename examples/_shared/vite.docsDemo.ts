import type { UserConfig } from "vite";

/** Vite options when `DOCS_DEMO_BUILD=1` (docs/scripts/build-docs-demos.sh). */
export function docsDemoViteOptions(): UserConfig {
  if (process.env.DOCS_DEMO_BUILD !== "1") {
    return { base: "/" };
  }
  return {
    base: "./",
    define: {
      "import.meta.env.VITE_DOCS_DEMO": JSON.stringify("1"),
    },
  };
}

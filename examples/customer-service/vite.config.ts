import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base when bundling for embedded docs demos (docs/scripts/build-docs-demos.sh).
  base: process.env.DOCS_DEMO_BUILD === "1" ? "./" : "/",
});


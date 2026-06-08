import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.DOCS_DEMO_BUILD === "1" ? "./" : "/",
  define: {
    "import.meta.env.VITE_DOCS_DEMO": JSON.stringify(process.env.DOCS_DEMO_BUILD === "1" ? "1" : ""),
  },
});

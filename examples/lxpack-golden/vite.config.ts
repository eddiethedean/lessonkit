import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.DOCS_DEMO_BUILD === "1" ? "./" : "/",
});

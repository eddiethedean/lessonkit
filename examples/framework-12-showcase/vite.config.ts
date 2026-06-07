import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { docsDemoViteOptions } from "../_shared/vite.docsDemo";

export default defineConfig({
  plugins: [react()],
  ...docsDemoViteOptions(),
});

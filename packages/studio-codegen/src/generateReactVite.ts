import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import { buildLessonkitManifest } from "./toDescriptor";
import type { GeneratedFile, StudioExportOptions } from "./types";
import { emitAppTsx } from "./emitJsx";

const DEFAULT_LESSONKIT_VERSION = "1.2.0";
const DEFAULT_STUDIO_VERSION = "0.3.2";

function resolveVersions(options: StudioExportOptions) {
  return {
    lessonkit: options.lessonkitVersion ?? DEFAULT_LESSONKIT_VERSION,
    studio: options.studioVersion ?? DEFAULT_STUDIO_VERSION,
  };
}

function basePackageJson(project: StudioProjectV1, options: StudioExportOptions): GeneratedFile {
  const versions = resolveVersions(options);
  return {
    path: "package.json",
    content: `${JSON.stringify(
      {
        name: project.course.courseId,
        private: true,
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
          typecheck: "tsc -p tsconfig.json",
        },
        dependencies: {
          "@lessonkit/core": `^${versions.lessonkit}`,
          "@lessonkit/react": `^${versions.lessonkit}`,
          "@lessonkit/themes": `^${versions.lessonkit}`,
          "@lessonkit/xapi": `^${versions.lessonkit}`,
          "@lessonkit/studio-schema": `^${versions.studio}`,
          "@lessonkit/studio-renderer": `^${versions.studio}`,
          react: "^18.3.1",
          "react-dom": "^18.3.1",
        },
        devDependencies: {
          "@types/react": "^18.3.23",
          "@types/react-dom": "^18.3.7",
          "@vitejs/plugin-react": "^4.6.0",
          typescript: "^5.8.3",
          vite: "^7.1.3",
        },
      },
      null,
      2,
    )}\n`,
  };
}

function jsxPackageJson(project: StudioProjectV1, options: StudioExportOptions): GeneratedFile {
  const pkg = JSON.parse(basePackageJson(project, options).content) as Record<string, unknown>;
  const deps = pkg.dependencies as Record<string, string>;
  delete deps["@lessonkit/studio-schema"];
  delete deps["@lessonkit/studio-renderer"];
  return {
    path: "package.json",
    content: `${JSON.stringify({ ...pkg, dependencies: deps }, null, 2)}\n`,
  };
}

function sharedStaticFiles(project: StudioProjectV1, options: StudioExportOptions): GeneratedFile[] {
  const manifest = buildLessonkitManifest(project, options);
  const preset = options.theme?.preset ?? "default";

  return [
    {
      path: "lessonkit.json",
      content: `${JSON.stringify(manifest, null, 2)}\n`,
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n});\n`,
    },
    {
      path: "tsconfig.json",
      content: `${JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            lib: ["ES2022", "DOM", "DOM.Iterable"],
            module: "ESNext",
            moduleResolution: "bundler",
            jsx: "react-jsx",
            strict: true,
            skipLibCheck: true,
            noEmit: true,
            resolveJsonModule: true,
            isolatedModules: true,
          },
          include: ["src"],
        },
        null,
        2,
      )}\n`,
    },
    {
      path: "index.html",
      content: `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${project.course.title.replace(/</g, "")}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
    },
    {
      path: "src/styles.css",
      content: `body {\n  margin: 0;\n  min-height: 100vh;\n  background: var(--lk-color-background, #f8fafc);\n}\n\n#root,\n.app-shell {\n  max-width: 48rem;\n  margin: 0 auto;\n  padding: 1.5rem;\n}\n`,
    },
    {
      path: ".gitignore",
      content: "node_modules\ndist\n.lxpack\n",
    },
    {
      path: "src/project.json",
      content: `${JSON.stringify(project, null, 2)}\n`,
    },
    {
      path: "src/main.tsx",
      content: rendererMainTsx(preset),
    },
  ];
}

function rendererMainTsx(preset: string): string {
  return `import React from "react";
import { createRoot } from "react-dom/client";
import { loadStudioProject } from "@lessonkit/studio-schema";
import { StudioRenderer } from "@lessonkit/studio-renderer";
import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIStatement } from "@lessonkit/xapi";
import projectRaw from "./project.json";
import "./styles.css";

const loaded = loadStudioProject(projectRaw);
if (!loaded.ok) {
  throw new Error(
    \`Invalid project.json:\\n\${loaded.issues.map((i) => \`\${i.path}: \${i.message}\`).join("\\n")}\`,
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StudioRenderer
    project={loaded.project}
    theme={{ preset: "${preset}", mode: "light" }}
    config={{
      tracking: {
        sink: (event: TelemetryEvent) => {
          console.log("[telemetry]", event);
        },
      },
      xapi: {
        enabled: true,
        transport: (statement: XAPIStatement) => {
          console.log("[xapi]", statement);
        },
      },
    }}
  />,
);
`;
}

export function generateReactViteFiles(
  project: StudioProjectV1,
  options: StudioExportOptions = {},
): GeneratedFile[] {
  const staticFiles = sharedStaticFiles(project, options);
  return [basePackageJson(project, options), ...staticFiles].sort((a, b) =>
    a.path.localeCompare(b.path),
  );
}

export function generateReactViteJsxFiles(
  project: StudioProjectV1,
  options: StudioExportOptions = {},
): GeneratedFile[] {
  const preset = options.theme?.preset ?? "default";
  const files: GeneratedFile[] = [
    jsxPackageJson(project, options),
    ...sharedStaticFiles(project, options).filter((f) => f.path !== "package.json" && f.path !== "src/main.tsx" && f.path !== "src/project.json"),
    { path: "src/App.tsx", content: emitAppTsx(project, preset) },
    {
      path: "src/main.tsx",
      content: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(<App />);
`,
    },
  ];
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export function generateExportFiles(
  project: StudioProjectV1,
  options: StudioExportOptions = {},
): GeneratedFile[] {
  const mode = options.exportMode ?? "renderer";
  return mode === "jsx" ? generateReactViteJsxFiles(project, options) : generateReactViteFiles(project, options);
}

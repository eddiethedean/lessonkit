import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "../../templates/vite-react");
const dest = resolve(root, "template/vite-react");

await rm(dest, { recursive: true, force: true });
await mkdir(dirname(dest), { recursive: true });
await cp(source, dest, { recursive: true });

const pkgPath = resolve(dest, "package.json");
const pkg = JSON.parse(await readFile(pkgPath, "utf8"));

pkg.name = "{{name}}";
pkg.private = true;
pkg.scripts = {
  dev: "lessonkit dev",
  build: "lessonkit build",
  preview: "vite preview",
  "package:scorm12": "lessonkit package --target scorm12",
  "package:scorm2004": "lessonkit package --target scorm2004",
  "package:standalone": "lessonkit package --target standalone",
  "package:xapi": "lessonkit package --target xapi",
  "package:cmi5": "lessonkit package --target cmi5",
  typecheck: "tsc -p tsconfig.json",
  test: "vitest run --passWithNoTests",
  "test:coverage": "vitest run --coverage --passWithNoTests=false",
};

const lessonkitVersion = "^1.6.6";
pkg.dependencies = {
  "@lessonkit/core": lessonkitVersion,
  "@lessonkit/react": lessonkitVersion,
  "@lessonkit/themes": lessonkitVersion,
  "@lessonkit/xapi": lessonkitVersion,
  react: "^19.2.7",
  "react-dom": "^19.2.7",
};

pkg.devDependencies = {
  "@lessonkit/cli": lessonkitVersion,
  "@lessonkit/lxpack": lessonkitVersion,
  "@testing-library/react": "^16.3.0",
  "@testing-library/dom": "^10.4.1",
  "@types/react": "^19.2.17",
  "@types/react-dom": "^19.2.3",
  "@vitejs/plugin-react": "^6.0.2",
  jsdom: "^29.1.1",
  typescript: "^6.0.3",
  vite: "^8.0.11",
  vitest: "^4.1.8",
};

await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log(`Copied template: ${source} -> ${dest}`);

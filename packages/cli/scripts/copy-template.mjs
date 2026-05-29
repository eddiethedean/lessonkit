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
  "package:standalone": "lessonkit package --target standalone",
  typecheck: "tsc -p tsconfig.json",
  test: "vitest run --passWithNoTests",
  "test:coverage": "vitest run --coverage --passWithNoTests=false",
};

const lessonkitVersion = "^0.8.1";
pkg.dependencies = {
  "@lessonkit/core": lessonkitVersion,
  "@lessonkit/react": lessonkitVersion,
  "@lessonkit/themes": lessonkitVersion,
  "@lessonkit/xapi": lessonkitVersion,
  react: "^18.3.1",
  "react-dom": "^18.3.1",
};

pkg.devDependencies = {
  "@lessonkit/cli": lessonkitVersion,
  "@lessonkit/lxpack": lessonkitVersion,
  "@testing-library/react": "^16.3.0",
  "@types/react": "^18.3.23",
  "@types/react-dom": "^18.3.7",
  "@vitejs/plugin-react": "^4.6.0",
  jsdom: "^26.1.0",
  typescript: "^5.8.3",
  vite: "^7.1.3",
  vitest: "^3.2.4",
};

await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log(`Copied template: ${source} -> ${dest}`);

/**
 * Align framework package versions and dependency ranges before npm publish in CI.
 *
 * Usage:
 *   node scripts/release/prepare-publish.mjs <version>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const packagesDir = path.join(root, "packages");

const LESSONKIT_DIRS = [
  "core",
  "xapi",
  "accessibility",
  "themes",
  "lxpack",
  "react",
  "cli",
];

const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

function readPkg(dirName) {
  const pkgPath = path.join(packagesDir, dirName, "package.json");
  return { pkgPath, pkg: JSON.parse(fs.readFileSync(pkgPath, "utf8")) };
}

function writePkg(dirName, pkg) {
  const { pkgPath } = readPkg(dirName);
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function setVersion(dirName, version) {
  const { pkg } = readPkg(dirName);
  pkg.version = version;
  writePkg(dirName, pkg);
}

function alignDepsWithRules(dirNames, rules) {
  for (const dirName of dirNames) {
    const { pkg } = readPkg(dirName);
    let changed = false;
    for (const field of DEP_FIELDS) {
      const deps = pkg[field];
      if (!deps) continue;
      for (const [name] of Object.entries(deps)) {
        for (const rule of rules) {
          if (rule.match(name)) {
            deps[name] = rule.value;
            changed = true;
            break;
          }
        }
      }
    }
    if (changed) writePkg(dirName, pkg);
  }
}

const version = process.argv[2];

if (!version) {
  console.error("Usage: node scripts/release/prepare-publish.mjs <version>");
  process.exit(1);
}

for (const dir of LESSONKIT_DIRS) {
  setVersion(dir, version);
}
alignDepsWithRules(LESSONKIT_DIRS, [
  { match: (name) => name.startsWith("@lessonkit/"), value: version },
]);

console.log(`LessonKit publish: @lessonkit/* @ ${version}`);

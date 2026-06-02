/**
 * Align package versions and dependency ranges before npm publish in CI.
 *
 * Usage:
 *   node scripts/release/prepare-publish.mjs lessonkit <version>
 *   node scripts/release/prepare-publish.mjs studio <version>
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

const STUDIO_DIRS = ["studio-schema", "studio-renderer", "studio-builder", "studio-ui", "studio-codegen"];

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

function lessonkitVersionFromRepo() {
  const { pkg } = readPkg("core");
  return pkg.version;
}

function prepareLessonkitPublish(version) {
  for (const dir of LESSONKIT_DIRS) {
    setVersion(dir, version);
  }
  alignDepsWithRules(LESSONKIT_DIRS, [
    { match: (name) => name.startsWith("@lessonkit/"), value: version },
  ]);
}

function isStudioScopedPackage(name) {
  return name.startsWith("@lessonkit/studio-");
}

function prepareStudioPublish(studioVersion) {
  const lessonkitVersion = lessonkitVersionFromRepo();
  for (const dir of STUDIO_DIRS) {
    setVersion(dir, studioVersion);
  }
  alignDepsWithRules(STUDIO_DIRS, [
    { match: (name) => isStudioScopedPackage(name), value: studioVersion },
    {
      match: (name) => name.startsWith("@lessonkit/") && !isStudioScopedPackage(name),
      value: lessonkitVersion,
    },
  ]);
  console.log(`Studio publish: @lessonkit/studio-* @ ${studioVersion}`);
  console.log(`Pinned other @lessonkit/* dependencies to ${lessonkitVersion} (from packages/core)`);
}

const mode = process.argv[2];
const version = process.argv[3];

if (!mode || !version) {
  console.error("Usage: node scripts/release/prepare-publish.mjs <lessonkit|studio> <version>");
  process.exit(1);
}

if (mode === "lessonkit") {
  prepareLessonkitPublish(version);
} else if (mode === "studio") {
  prepareStudioPublish(version);
} else {
  console.error(`Unknown mode: ${mode}`);
  process.exit(1);
}

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBlockCatalog } from "../dist/index.js";

const root = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(root, "..");

for (const version of [1, 3]) {
  const out = join(pkgRoot, `block-catalog.v${version}.json`);
  const entries = buildBlockCatalog({ version });
  writeFileSync(out, `${JSON.stringify({ schemaVersion: version, entries }, null, 2)}\n`);
}

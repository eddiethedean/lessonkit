import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBlockCatalog } from "../dist/index.js";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "..", "block-catalog.v3.json");
const entries = buildBlockCatalog({ version: 3 });
writeFileSync(out, `${JSON.stringify({ schemaVersion: 3, entries }, null, 2)}\n`);

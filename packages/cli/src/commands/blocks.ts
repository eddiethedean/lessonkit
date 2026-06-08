import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { CliJsonResult } from "../lib/errors.js";

type BlockCatalogEntry = {
  type: string;
  category?: string;
  tier?: string;
  h5pMachineName?: string;
  description?: string;
};

type BlockCatalogV3 = {
  schemaVersion: number;
  entries: BlockCatalogEntry[];
};

export type BlocksListOptions = {
  json?: boolean;
  category?: string;
  tier?: string;
};

function loadBlockCatalog(): BlockCatalogV3 {
  const require = createRequire(import.meta.url);
  const catalogPath = require.resolve("@lessonkit/react/block-catalog.v3.json");
  return JSON.parse(readFileSync(catalogPath, "utf8")) as BlockCatalogV3;
}

function filterEntries(
  entries: BlockCatalogEntry[],
  opts: BlocksListOptions,
): BlockCatalogEntry[] {
  return entries.filter((entry) => {
    if (opts.category && entry.category !== opts.category) return false;
    if (opts.tier && entry.tier !== opts.tier) return false;
    return true;
  });
}

export async function runBlocksList(opts: BlocksListOptions): Promise<CliJsonResult> {
  const catalog = loadBlockCatalog();
  const entries = filterEntries(catalog.entries, opts);

  if (!opts.json) {
    const lines = [
      "type\tcategory\th5pMachineName",
      ...entries.map((entry) =>
        [
          entry.type,
          entry.category ?? "—",
          entry.h5pMachineName ?? "—",
        ].join("\t"),
      ),
    ];
    return {
      ok: true,
      command: "blocks list",
      schemaVersion: catalog.schemaVersion,
      count: entries.length,
      text: lines.join("\n"),
    };
  }

  return {
    ok: true,
    command: "blocks list",
    schemaVersion: catalog.schemaVersion,
    count: entries.length,
    entries,
  };
}

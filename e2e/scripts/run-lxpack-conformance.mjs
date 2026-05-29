#!/usr/bin/env node
import { runConformanceMatrix } from "@lxpack/conformance";

const result = await runConformanceMatrix();

console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  console.error("LXPack conformance matrix failed");
  process.exit(1);
}

console.log("LXPack conformance matrix passed");

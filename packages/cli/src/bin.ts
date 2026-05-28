#!/usr/bin/env node
import { run } from "./index.js";

await run(process.argv);
process.exit(process.exitCode ?? 0);

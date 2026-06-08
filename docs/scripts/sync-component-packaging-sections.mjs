#!/usr/bin/env node
/**
 * Packaging snippets now live in the Manifest tab of each component page.
 * This script delegates to sync-component-try-it-tabs.mjs.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tabsScript = path.join(__dirname, "sync-component-try-it-tabs.mjs");

const child = spawn(process.execPath, [tabsScript], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));

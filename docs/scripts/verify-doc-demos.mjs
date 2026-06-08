#!/usr/bin/env node
/**
 * Smoke-test embedded doc demo bundles (production guard + relative base).
 * Run after docs/scripts/build-docs-demos.sh.
 *
 * Requires Playwright (install via @lessonkit/e2e workspace).
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DEMOS = path.join(ROOT, "docs/_static/demos");

const SAMPLES = [
  "react-vite",
  "data-privacy",
  "customer-service",
  "framework-11-showcase",
  "framework-12-showcase",
  "interactive-book",
  "slide-deck",
  "assessments-p0",
  "lxpack-golden",
];

function contentType(filePath) {
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  return "application/octet-stream";
}

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const urlPath = decodeURIComponent(req.url?.split("?")[0] ?? "/");
      const rel = urlPath === "/" ? "/index.html" : urlPath;
      const filePath = path.join(rootDir, rel);
      try {
        const body = await readFile(filePath);
        res.writeHead(200, { "Content-Type": contentType(filePath) });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end("not found");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function verifyDemo(browser, demoRoot, slug) {
  const server = await startStaticServer(demoRoot);
  const { port } = server.address();
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  try {
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "networkidle" });
    const rootLen = await page.locator("#root").evaluate((el) => el.innerHTML.length);
    if (errors.length > 0) {
      throw new Error(`${slug}: ${errors.join(" | ")}`);
    }
    if (rootLen < 50) {
      throw new Error(`${slug}: #root is empty (blank demo bundle)`);
    }
    console.log(`OK docs demo: ${slug}`);
  } finally {
    await page.close();
    server.close();
  }
}

async function main() {
  const browser = await chromium.launch();
  try {
    for (const slug of SAMPLES) {
      await verifyDemo(browser, path.join(DEMOS, slug), slug);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});

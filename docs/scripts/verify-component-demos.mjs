#!/usr/bin/env node
/**
 * Smoke-test embedded component demo bundles (hash routes + relative base).
 * Run after docs/scripts/build-component-demos.sh.
 */
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DEMOS = path.join(ROOT, "docs/_static/component-demos");
const MANIFEST = path.join(ROOT, "docs/component-demos/manifest.json");

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

const MOBILE_SLUGS = new Set([
  "drag-and-drop",
  "drag-the-words",
  "word-search",
  "sort-paragraphs",
  "quiz",
]);

async function verifySlug(browser, slug, { mobile = false } = {}) {
  const server = await startStaticServer(DEMOS);
  const { port } = server.address();
  const page = await browser.newPage();
  if (mobile) {
    await page.setViewportSize({ width: 390, height: 844 });
  }
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  try {
    await page.goto(`http://127.0.0.1:${port}/index.html#/${slug}`, {
      waitUntil: "networkidle",
    });
    const rootLen = await page.locator("#root").evaluate((el) => el.innerHTML.length);
    if (errors.length > 0) {
      throw new Error(`${slug}: ${errors.join(" | ")}`);
    }
    if (rootLen < 50) {
      throw new Error(`${slug}: #root is empty (blank component demo)`);
    }
    console.log(`OK component demo${mobile ? " (mobile)" : ""}: ${slug}`);
  } finally {
    await page.close();
    server.close();
  }
}

async function readDemoSources() {
  const srcDir = path.join(ROOT, "docs/component-demos/src");
  const demosDir = path.join(srcDir, "demos");
  const files = [
    path.join(srcDir, "registry.tsx"),
    ...(await readdir(demosDir)).map((name) => path.join(demosDir, name)),
  ];
  return Promise.all(files.map((file) => readFile(file, "utf8"))).then((parts) => parts.join("\n"));
}

async function assertManifestMatchesRegistry() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const registrySource = await readDemoSources();
  const slugs = new Set(manifest.components.map((c) => c.slug));
  const slugMatches = [...registrySource.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
  const registrySlugs = new Set(slugMatches);
  for (const slug of slugs) {
    if (!registrySlugs.has(slug)) {
      throw new Error(`manifest slug missing from registry: ${slug}`);
    }
  }
  for (const slug of registrySlugs) {
    if (!slugs.has(slug)) {
      throw new Error(`registry slug missing from manifest: ${slug}`);
    }
  }
}

async function main() {
  await assertManifestMatchesRegistry();
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const browser = await chromium.launch();
  try {
    for (const { slug } of manifest.components) {
      await verifySlug(browser, slug);
      if (MOBILE_SLUGS.has(slug)) {
        await verifySlug(browser, slug, { mobile: true });
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});

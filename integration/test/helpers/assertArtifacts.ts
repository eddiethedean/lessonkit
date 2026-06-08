import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export function assertViteDist(distDir: string): void {
  const indexHtml = join(distDir, "index.html");
  if (!existsSync(indexHtml)) {
    throw new Error(`Expected Vite dist at ${indexHtml}`);
  }

  const assetsDir = join(distDir, "assets");
  if (!existsSync(assetsDir)) {
    throw new Error(`Expected dist/assets at ${assetsDir}`);
  }

  const assets = readdirSync(assetsDir);
  if (assets.length === 0) {
    throw new Error(`Expected non-empty dist/assets at ${assetsDir}`);
  }
}

export function assertScormZip(zipPath: string): void {
  if (!existsSync(zipPath)) {
    throw new Error(`SCORM zip not found: ${zipPath}`);
  }

  const listing = execFileSync("unzip", ["-l", zipPath], { encoding: "utf8" });
  if (!listing.includes("imsmanifest.xml")) {
    throw new Error(`SCORM zip missing imsmanifest.xml: ${zipPath}`);
  }
  if (!listing.includes("dist/index.html") && !listing.includes("index.html")) {
    throw new Error(`SCORM zip missing SPA index: ${zipPath}`);
  }
}

export function assertStandaloneDir(standaloneDir: string): void {
  if (!existsSync(standaloneDir) || !statSync(standaloneDir).isDirectory()) {
    throw new Error(`Standalone output not found: ${standaloneDir}`);
  }

  const entries = readdirSync(standaloneDir);
  const hasHtml = entries.some((name) => name.endsWith(".html"));
  if (!hasHtml) {
    throw new Error(`Standalone dir has no launch HTML: ${standaloneDir}`);
  }
}

export function assertLkcourseZip(zipPath: string): void {
  if (!existsSync(zipPath)) {
    throw new Error(`.lkcourse archive not found: ${zipPath}`);
  }
  const stat = statSync(zipPath);
  if (!stat.isFile() || stat.size === 0) {
    throw new Error(`.lkcourse archive empty or invalid: ${zipPath}`);
  }

  const listing = execFileSync("unzip", ["-l", zipPath], { encoding: "utf8" });
  if (!listing.includes("manifest.json")) {
    throw new Error(`.lkcourse missing manifest.json: ${zipPath}`);
  }
  if (!listing.includes("interchange.json")) {
    throw new Error(`.lkcourse missing interchange.json: ${zipPath}`);
  }
  if (!listing.includes("dist/index.html")) {
    throw new Error(`.lkcourse missing dist/index.html: ${zipPath}`);
  }
}

export function assertZipExists(zipPath: string): void {
  if (!existsSync(zipPath)) {
    throw new Error(`Zip artifact not found: ${zipPath}`);
  }
  const stat = statSync(zipPath);
  if (!stat.isFile() || stat.size === 0) {
    throw new Error(`Zip artifact empty or invalid: ${zipPath}`);
  }
}

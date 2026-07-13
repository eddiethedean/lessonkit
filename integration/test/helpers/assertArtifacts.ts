import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function unpackZipToTemp(zipPath: string): string {
  const dir = mkdtempSync(join(tmpdir(), "lk-artifact-"));
  execFileSync("unzip", ["-q", zipPath, "-d", dir]);
  return dir;
}

function findManifestPath(root: string, fileName: string): string {
  const direct = join(root, fileName);
  if (existsSync(direct)) {
    return direct;
  }
  for (const entry of readdirSync(root)) {
    const candidate = join(root, entry, fileName);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`${fileName} not found in unpacked artifact: ${root}`);
}

function resolveLaunchFile(root: string, manifestDir: string, href: string): string {
  const launchFile = join(manifestDir, href);
  if (existsSync(launchFile)) {
    return launchFile;
  }
  const fromRoot = join(root, href);
  if (existsSync(fromRoot)) {
    return fromRoot;
  }
  throw new Error(`launch href ${href} does not exist on disk (checked ${launchFile} and ${fromRoot})`);
}

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

  const root = unpackZipToTemp(zipPath);
  try {
    const manifestPath = findManifestPath(root, "imsmanifest.xml");
    const xml = readFileSync(manifestPath, "utf8");
    const launchHref = xml.match(/<resource[^>]+href="([^"]+)"/)?.[1];
    if (!launchHref) {
      throw new Error(`SCORM manifest has no resource href: ${zipPath}`);
    }
    resolveLaunchFile(root, join(manifestPath, ".."), launchHref);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

export function assertXapiZip(zipPath: string, expectedActivityIri?: string): void {
  if (!existsSync(zipPath)) {
    throw new Error(`xAPI zip not found: ${zipPath}`);
  }

  const root = unpackZipToTemp(zipPath);
  try {
    const tincanPath = findManifestPath(root, "tincan.xml");
    const xml = readFileSync(tincanPath, "utf8");
    const launchHref = xml.match(/<launch[^>]*>([^<]+)<\/launch>/)?.[1]?.trim();
    if (!launchHref) {
      throw new Error(`tincan.xml has no activity launch URL: ${zipPath}`);
    }
    resolveLaunchFile(root, join(tincanPath, ".."), launchHref);
    if (expectedActivityIri && !xml.includes(expectedActivityIri)) {
      throw new Error(`tincan.xml missing activity IRI ${expectedActivityIri}: ${zipPath}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

export function assertCmi5Zip(zipPath: string, expectedActivityIri?: string): void {
  if (!existsSync(zipPath)) {
    throw new Error(`cmi5 zip not found: ${zipPath}`);
  }

  const root = unpackZipToTemp(zipPath);
  try {
    const cmi5Path = findManifestPath(root, "cmi5.xml");
    const xml = readFileSync(cmi5Path, "utf8");
    const launchHref = xml.match(/<url>([^<]+)<\/url>/)?.[1]?.trim();
    if (!launchHref) {
      throw new Error(`cmi5.xml has no AU launch URL: ${zipPath}`);
    }
    resolveLaunchFile(root, join(cmi5Path, ".."), launchHref);
    if (expectedActivityIri && !xml.includes(expectedActivityIri)) {
      throw new Error(`cmi5.xml missing activity IRI ${expectedActivityIri}: ${zipPath}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
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

  const root = unpackZipToTemp(zipPath);
  try {
    findManifestPath(root, "manifest.json");
    findManifestPath(root, "interchange.json");
    resolveLaunchFile(root, root, "dist/index.html");
  } finally {
    rmSync(root, { recursive: true, force: true });
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

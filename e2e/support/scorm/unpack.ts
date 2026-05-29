import { existsSync, readFileSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

/** Unpack a SCORM ZIP to `destDir` (replaces existing). Requires `unzip` on PATH. */
export async function unpackScormZip(zipPath: string, destDir: string): Promise<void> {
  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });
  execFileSync("unzip", ["-o", "-q", zipPath, "-d", destDir], { stdio: "inherit" });
}

/**
 * Resolve launch HTML path relative to unpacked root from imsmanifest.xml.
 * Picks the first resource href in the default organization.
 */
export function resolveScorm12LaunchPath(unpackedDir: string): string {
  const manifestPath = join(unpackedDir, "imsmanifest.xml");
  if (!existsSync(manifestPath)) {
    throw new Error(`imsmanifest.xml not found in ${unpackedDir}`);
  }
  const xml = readFileSync(manifestPath, "utf8");
  const resourceMatch = xml.match(/<resource[^>]+href="([^"]+)"/i);
  if (!resourceMatch?.[1]) {
    throw new Error(`No resource href in ${manifestPath}`);
  }
  const href = resourceMatch[1];
  const launchPath = join(unpackedDir, href);
  if (!existsSync(launchPath)) {
    throw new Error(`Launch file not found: ${launchPath}`);
  }
  return launchPath;
}

export function launchFileUrl(launchPath: string): string {
  return `file://${launchPath}`;
}

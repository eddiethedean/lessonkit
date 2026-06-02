import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import type { GeneratedFile } from "./types";

export async function writeGeneratedFiles(
  outDir: string,
  files: GeneratedFile[],
): Promise<void> {
  for (const file of files) {
    const target = join(outDir, file.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, "utf8");
  }
}

export async function copyAssetFiles(
  assetsDir: string,
  outDir: string,
  relativePaths: string[],
): Promise<void> {
  for (const rel of relativePaths) {
    const source = resolve(assetsDir, rel);
    const target = join(outDir, rel);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
  }
}

export function collectRelativeAssetPaths(files: GeneratedFile[]): string[] {
  const paths = new Set<string>();
  const assetPattern = /assets\/[a-zA-Z0-9_./-]+/g;
  for (const file of files) {
    for (const match of file.content.matchAll(assetPattern)) {
      paths.add(match[0]);
    }
  }
  return [...paths].sort();
}

export function relativizePaths(baseDir: string, targetDir: string): string {
  return relative(baseDir, targetDir) || ".";
}

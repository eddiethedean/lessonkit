import * as fsp from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { assertRealPathUnderRoot, resolveComparablePath } from "../spaPath";
import { renameOrCopy } from "./promote";

export async function relocatePackageOutput(
  builtOutputPath: string | undefined,
  requestedOutputPath: string | undefined,
  projectRoot: string,
): Promise<string | undefined> {
  if (!builtOutputPath || !requestedOutputPath) return builtOutputPath;

  const resolvedBuilt = resolveComparablePath(builtOutputPath);
  const resolvedRequested = resolveComparablePath(requestedOutputPath);
  if (resolvedBuilt === resolvedRequested) return builtOutputPath;

  const root = resolve(projectRoot);
  assertRealPathUnderRoot(root, resolvedRequested);
  await fsp.mkdir(dirname(resolvedRequested), { recursive: true });
  await renameOrCopy(resolvedBuilt, resolvedRequested);
  return resolvedRequested;
}

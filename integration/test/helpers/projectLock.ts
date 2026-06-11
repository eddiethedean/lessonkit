const tail = new Map<string, Promise<void>>();

/** Serialize CLI packaging/build steps that share one project directory. */
export async function withProjectLock<T>(
  projectDir: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  const prev = tail.get(projectDir) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const next = prev.then(() => gate);
  tail.set(projectDir, next);
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (tail.get(projectDir) === next) {
      tail.delete(projectDir);
    }
  }
}

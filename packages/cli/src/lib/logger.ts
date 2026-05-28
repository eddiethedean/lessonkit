export type CliLogger = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export function createLogger(opts?: { json?: boolean }): CliLogger {
  if (opts?.json) {
    return {
      log: () => {},
      error: () => {},
    };
  }
  return console;
}

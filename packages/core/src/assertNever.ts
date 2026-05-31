/**
 * Exhaustiveness helper for switch/default branches.
 * @throws when called at runtime with an unexpected value.
 */
export function assertNever(value: never, message = "Unexpected value"): never {
  throw new Error(`${message}: ${String(value)}`);
}

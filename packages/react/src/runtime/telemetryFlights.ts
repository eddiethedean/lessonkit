/** Track in-flight telemetry pipeline emits so lifecycle teardown can await them. */
export function registerTelemetryFlight(
  flights: Set<Promise<void>>,
  result: void | Promise<void>,
): void | Promise<void> {
  if (result == null || typeof (result as Promise<void>).then !== "function") {
    return result;
  }
  flights.add(result);
  void result.finally(() => {
    flights.delete(result);
  });
  return result;
}

export async function awaitTelemetryFlights(flights: Set<Promise<void>>): Promise<void> {
  if (flights.size === 0) return;
  await Promise.all([...flights]);
}

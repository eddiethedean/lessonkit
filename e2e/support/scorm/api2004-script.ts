/**
 * SCORM 2004 4th Edition API mock (API_1484_11) for Playwright launch tests.
 */
export function scorm2004ApiInitScript(): void {
  const store: Record<string, string> = {
    "cmi.completion_status": "unknown",
    "cmi.success_status": "unknown",
    "cmi.score.scaled": "",
    "cmi.score.raw": "",
    "cmi.score.min": "0",
    "cmi.score.max": "1",
    "cmi.location": "",
    "cmi.suspend_data": "",
  };

  const log: Array<{ element: string; value: string }> = [];

  const api = {
    Initialize: (_param?: string) => "true",
    Terminate: (_param?: string) => "true",
    GetValue: (element: string) => store[element] ?? "",
    SetValue: (element: string, value: string) => {
      store[element] = String(value);
      log.push({ element, value: String(value) });
      return "true";
    },
    Commit: (_param?: string) => "true",
    GetLastError: () => "0",
    GetErrorString: (_code?: string) => "No Error",
    GetDiagnostic: (_code?: string) => "",
  };

  (window as unknown as { API_1484_11: typeof api }).API_1484_11 = api;
  (window as unknown as { __scorm2004Test: { store: typeof store; log: typeof log } }).__scorm2004Test =
    { store, log };
}

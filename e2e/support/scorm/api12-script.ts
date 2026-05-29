/**
 * SCORM 1.2 API mock injected into the LMS launch page before navigation.
 * Exposes `window.API` and `window.__scorm12Test` for Playwright assertions.
 */
export function scorm12ApiInitScript(): void {
  const store: Record<string, string> = {
    "cmi.core.lesson_status": "not attempted",
    "cmi.core.student_id": "e2e-learner",
    "cmi.core.student_name": "E2E Learner",
    "cmi.core.lesson_location": "",
    "cmi.core.score.raw": "",
    "cmi.core.score.min": "0",
    "cmi.core.score.max": "100",
    "cmi.suspend_data": "",
  };

  const log: Array<{ element: string; value: string }> = [];

  const api = {
    LMSInitialize: (_param?: string) => {
      return "true";
    },
    LMSFinish: (_param?: string) => {
      return "true";
    },
    LMSGetValue: (element: string) => {
      return store[element] ?? "";
    },
    LMSSetValue: (element: string, value: string) => {
      store[element] = String(value);
      log.push({ element, value: String(value) });
      return "true";
    },
    LMSCommit: (_param?: string) => {
      return "true";
    },
    LMSGetLastError: () => "0",
    LMSGetErrorString: (_code?: string) => "No Error",
    LMSGetDiagnostic: (_code?: string) => "",
  };

  (window as unknown as { API: typeof api }).API = api;
  (window as unknown as { __scorm12Test: { store: typeof store; log: typeof log } }).__scorm12Test =
    { store, log };
}

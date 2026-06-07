# LXPack bridge reference (1.0)

When a LessonKit SPA runs inside an LXPack shell, telemetry and assessment completion can forward to `window.parent.lxpackBridge.v1`.

## Imports

```typescript
import {
  dispatchBridgeAction,
  forwardTelemetryToBridge,
  getLxpackBridge,
  mapLessonkitTelemetryToBridgeAction,
  notifyLxpackLessonComplete,
  telemetryEventToLessonkit,
} from "@lessonkit/lxpack/bridge";
```

## Provider integration

`@lessonkit/react` forwards completion events when `config.lxpack.bridge` is `"auto"`. The init template defaults to `"off"`; set `"auto"` for packaged LMS iframe deployments.

```ts
lxpack: {
  bridge: "auto",
  // Required in production builds — LMS parent frame origins (scheme + host + port).
  allowedParentOrigins: ["https://your-lms.example"],
},
```

Extra pipeline sinks can also call `forwardTelemetryToBridge` directly.

## Production security

| Environment | `bridge: "auto"` behavior |
| --- | --- |
| Development (`import.meta.env.DEV`) | Bridge may forward without an allowlist when the parent exposes `lxpackBridge.v1` |
| Production (`import.meta.env.PROD`) | **`allowedParentOrigins` is required** — forwarding is denied when the list is empty |

List every origin your LMS shell uses to host the packaged iframe (including staging). Use the exact scheme, host, and port (no path). To discover the parent origin in a SCORM preview, open browser devtools and inspect `document.referrer` or the parent frame URL.

Wire `config.observability.onLxpackBridgeMiss` so missing bridges or blocked origins surface in monitoring instead of failing silently.

## Telemetry → bridge action

```typescript
import { forwardTelemetryToBridge } from "@lessonkit/lxpack/bridge";
import { buildTelemetryEvent } from "@lessonkit/core";

const event = buildTelemetryEvent({
  name: "quiz_completed",
  courseId: "c",
  lessonId: "l",
  sessionId: "s",
  data: { checkId: "q1", score: 1, maxScore: 1, passingScore: 1 },
});

forwardTelemetryToBridge(event, "auto");
```

## Manual dispatch

```typescript
import { dispatchBridgeAction } from "@lessonkit/lxpack/bridge";

dispatchBridgeAction({
  type: "lessonkit/lesson-complete",
  lessonId: "intro",
});
```

## Related

- [Packaging reference](reference/packaging.md) — LMS export workflow
- [Telemetry reference](reference/telemetry.md) — event catalog

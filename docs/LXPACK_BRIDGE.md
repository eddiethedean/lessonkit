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

`@lessonkit/react` forwards completion events automatically when `config.lxpack.bridge` is `"auto"` (default). Set `"off"` to disable.

Extra pipeline sinks can also call `forwardTelemetryToBridge` directly.

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

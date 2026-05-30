# Plugins (1.0)

## Kinds

| Kind | Hooks |
|------|--------|
| `analytics` | `onTelemetry`, `wrapTrackingSink`, `onTelemetryBatch` |
| `assessment` | `scoreAssessment` |
| `lms` | `setup`, `dispose`, `onTelemetry` |

## Batching

| Config | Behavior |
|--------|----------|
| `sink` only | Per-event; `onTelemetryBatch` not called on flush |
| `batchSink` | Flush calls `onTelemetryBatch`, then `wrapTrackingSink` per event, then user `batchSink` |
| Both `sink` and `batchSink` | Flushed batches use **only** `batchSink` (dev warning) |

## Assessment override

`scoreAssessment` on Quiz choice — first matching `kind: "assessment"` wins.

Human reference: https://lessonkit.readthedocs.io/en/latest/reference/plugins.html

# LXPack bridge

When the React SPA runs inside an LXPack export (SCORM, xAPI, etc.), the parent frame exposes:

```javascript
window.parent.lxpackBridge.v1
```

LessonKit forwards `quiz_completed`, `course_completed`, and related events when `config.lxpack.bridge` is `"auto"` (default).

## Migration from 0.9.x

| 0.9.x | 1.0.0 |
|-------|--------|
| `setLxpackBridgeMode("off")` | `config: { lxpack: { bridge: "off" } }` |

Human reference: https://lessonkit.readthedocs.io/en/latest/reference/lxpack-bridge.html

# Examples

Runnable Vite + React courses demonstrating `@lessonkit/react` patterns and LMS packaging.

**Live demos:** [lessonkit.readthedocs.io/examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html)

| Directory | Course | Highlights |
| --- | --- | --- |
| [`react-vite/`](https://github.com/eddiethedean/lessonkit/tree/main/examples/react-vite) | Cybersecurity Awareness | Dark theme · email, SMS, Teams sims |
| [`data-privacy/`](https://github.com/eddiethedean/lessonkit/tree/main/examples/data-privacy) | GDPR Essentials | Compliance theme · case files, tabletop |
| [`customer-service/`](https://github.com/eddiethedean/lessonkit/tree/main/examples/customer-service) | De-escalation | Support theme · chat and voice coaching |
| [`lxpack-golden/`](https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden) | Warehouse Safety | Packaging reference · SCORM/xAPI smoke target |

Each app shares a modern LMS shell (`_shared/lms-ui.css`, `_shared/course-ui.tsx`) with themed variants.

## Run locally

From repo root:

```bash
npm install && npm run build:packages
npm -w lessonkit-example-react-vite run dev
```

Swap the workspace name for any example. Packaging requires Node **18+**.

## Docs embeds

```bash
bash docs/scripts/build-docs-demos.sh
```

See [examples guide](https://lessonkit.readthedocs.io/en/latest/examples/index.html).

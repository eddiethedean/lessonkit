# Quickstart (React)

## CLI scaffold

```bash
npx @lessonkit/cli init my-course
cd my-course
lessonkit dev
```

## Add to an existing Vite + React app

```bash
npm install @lessonkit/react @lessonkit/core react react-dom
npm install -D @lessonkit/xapi   # optional, for typed xAPI helpers
```

Wrap your app (or course subtree):

```tsx
import { useMemo } from "react";
import type { TelemetryEvent } from "@lessonkit/core";
import { Course, Lesson, Quiz, Scenario, ThemeProvider } from "@lessonkit/react";
import type { XAPIStatement } from "@lessonkit/xapi";

export default function App() {
  const config = useMemo(
    () => ({
      tracking: {
        sink: (event: TelemetryEvent) => console.log(event),
      },
      xapi: {
        transport: (statement: XAPIStatement) => console.log(statement),
      },
    }),
    [],
  );

  return (
    <ThemeProvider mode="light" preset="default">
      <Course title="My Course" courseId="my-course" config={config}>
        <Lesson title="Intro" lessonId="intro">
          <Scenario>
            <p>Welcome.</p>
          </Scenario>
          <Quiz
            checkId="intro-check"
            question="Ready to continue?"
            choices={["No", "Yes"]}
            answer="Yes"
          />
        </Lesson>
      </Course>
    </ThemeProvider>
  );
}
```

## Monorepo example

```bash
git clone https://github.com/eddiethedean/lessonkit.git
cd lessonkit && npm install && npm run build
npm -w lessonkit-example-react-vite run dev
```

## Next steps

- [Project structure](project-structure.md)
- [Components and hooks](components-and-hooks.md)
- [Packaging and CLI](packaging-and-cli.md)

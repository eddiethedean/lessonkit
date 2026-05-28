# LessonKit Technical Specification

## Monorepo Structure

```text
lessonkit/
├── packages/
│   ├── core/
│   ├── react/
│   ├── xapi/
│   ├── accessibility/
│   ├── themes/
│   ├── cli/
│   └── lxpack/          (planned adapter for LXPack exports)
├── examples/
├── docs/
└── templates/
```

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite

## Documentation

- Storybook
- Docusaurus

## Testing

- Vitest
- React Testing Library
- Playwright

## Packaging

- tsup
- npm workspaces
- Changesets
- LXPack (for SCORM/xAPI/cmi5/standalone packaging via adapter)

---

# Core Component API

## Example

```tsx
import {
  Course,
  Lesson,
  Quiz,
  Scenario,
} from "lessonkit";

export default function SecurityTraining() {
  return (
    <Course title="Cybersecurity Basics">
      <Lesson title="Phishing Awareness">
        <Scenario>
          <p>You receive a suspicious email.</p>
        </Scenario>

        <Quiz
          question="What should you do first?"
          choices={[
            "Open attachment",
            "Verify sender"
          ]}
          answer="Verify sender"
        />
      </Lesson>
    </Course>
  );
}
```

---

# Accessibility Requirements

## WCAG Support

- WCAG 2.1 AA target

## Required Features

- Keyboard navigation
- Semantic HTML
- ARIA support
- Screen reader compatibility
- Focus management
- Reduced motion support

---

# Analytics System

## Tracking Goals

- Course completion
- Quiz scoring
- Interaction telemetry
- Time-on-task
- Branching analytics

---

# xAPI Integration

## Features

- xAPI statement generation
- LRS support
- Session tracking
- Offline queueing

## Example

```tsx
const tracking = useXAPI();

tracking.completeLesson({
  lessonId: "phishing-101"
});
```

---

# SCORM Support

## Planned Versions

- SCORM 1.2
- SCORM 2004

## Features

- packaged via LXPack (preferred) through `@lessonkit/lxpack`
- bookmarking
- suspend/resume
- score reporting

---

# Theme System

## Goals

- Organizational branding
- Custom layouts
- Shared design systems
- Reusable internal themes

---

# Plugin Architecture

## Future Plugin Areas

- AI integrations
- LMS connectors
- Analytics providers
- Assessment engines
- Custom interactions

---

# CLI Roadmap

```bash
lessonkit init
lessonkit dev
lessonkit build
lessonkit package
lessonkit publish
```

---

# Generator-friendly authoring (AI/dev)

LessonKit should be straightforward for software developers and safe for AI code generators to emit.

Key requirements:

- **Stable contracts**: component/hook APIs are documented and versioned.
- **Deterministic identities**: stable `courseId` / `lessonId` / assessment ids (no hidden randomness) so regeneration yields minimal diffs.
- **Machine-readable block catalog**: the set of supported runtime primitives is exportable as JSON so generators can validate inputs and avoid unsupported combinations.
- **Dual export parity**: React/Vite and LXPack-packaged artifacts match behavior and theming for the same course.

---

# Suggested npm Structure

- lessonkit
- @lessonkit/core
- @lessonkit/react
- @lessonkit/xapi
- @lessonkit/scorm
- @lessonkit/cli

---

# MVP Recommendation

Initial release should focus on:
- React components
- Accessibility
- xAPI support
- Developer experience
- Documentation
- Vite starter templates


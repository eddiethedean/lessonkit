# LessonKit Technical Specification

## Monorepo Structure

```text
lessonkit/
├── packages/
│   ├── core/
│   ├── react/
│   ├── xapi/
│   ├── scorm/
│   ├── accessibility/
│   ├── themes/
│   └── cli/
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

- imsmanifest.xml generation
- ZIP packaging
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


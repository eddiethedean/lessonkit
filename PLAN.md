# LessonKit Plan Document

## Vision

LessonKit is a React-first learning experience development framework for modern learning experience developers, instructional designers, and frontend engineers.

The goal is to provide reusable React components, LMS interoperability, accessibility-first interactions, and analytics tooling for building modern interactive learning experiences.

---

# Core Goals

- Developer-first workflow
- React-native architecture
- LMS compatibility
- Accessibility-first components
- Reusable learning interactions
- Analytics and telemetry support
- Modern frontend tooling

---

# Target Audience

## Primary Users

- Tech-forward LX developers
- Frontend engineers building training systems
- Learning engineering teams
- Enterprise training organizations

## Secondary Users

- Instructional designers transitioning into development
- Government training teams
- EdTech startups
- Higher education teams
- AI-assisted development workflows (LLM code generation in IDEs)

---

# Strategic Positioning

LessonKit is not intended to immediately replace Storyline or Captivate.

Instead, it acts as:
- A developer tooling layer
- A reusable component ecosystem
- A React framework for learning experiences

Comparable to:
- React
- Next.js
- Vite
- Tailwind

---

# Reuse: components and themes

LessonKit should make it easy to **reuse learning interactions** across:

- multiple courses within the same org
- multiple apps (internal training portals, standalone web delivery, LMS delivery)
- AI-assisted code generation workflows

This requires:

- **Composable components**: stable `@lessonkit/react` primitives that can be assembled into many course shapes.
- **Reusable themes**: a token-based theme system (`@lessonkit/themes`) with a documented CSS variables contract and predictable override/merge rules.
- **Portable defaults**: a default theme and reference examples that can be copied and modified without adopting a complex build system.

---

# Initial MVP

## Components

- Course
- Lesson
- Quiz
- Scenario
- Reflection
- KnowledgeCheck
- ProgressTracker

## Hooks

- useProgress
- useTracking
- useQuizState
- useCompletion

## Features

- Accessibility-first interactions
- xAPI support
- Basic analytics
- Vite starter templates

---

# Long-Term Roadmap

> **Status:** Phases 1–3 shipped in **framework 1.0.0** (React components, LXPack packaging, CLI). Phase 4–5 remain future work (enterprise ecosystem, content expansion).

## Phase 1
React component library — **shipped (1.0.0)**

## Phase 2
Exports and packaging parity (web + LMS targets) — **shipped (1.0.0)**

## Phase 3
CLI tooling and automation-friendly workflows — **shipped (1.0.0)**

## Phase 4
AI-friendly authoring (generator-friendly APIs, machine-readable catalog, deterministic exports)

## Phase 5
Enterprise ecosystem

---

# Ecosystem Vision

Potential future packages:

- @lessonkit/core
- @lessonkit/react
- @lessonkit/lxpack
- @lessonkit/xapi
- @lessonkit/cli
- @lessonkit/storyboard

---

# Long-Term Opportunity

LessonKit aims to modernize learning experience development using:
- reusable UI architecture
- content-as-code workflows
- modern frontend engineering
- analytics-first learning systems


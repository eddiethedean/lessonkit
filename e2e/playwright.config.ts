import { defineConfig, devices } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const e2eRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(e2eRoot, "..");
const _harnessDir = join(e2eRoot, "fixtures/telemetry-harness");

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  globalSetup: "./global-setup.ts",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "golden-vite",
      testIgnore: [
        "**/telemetry-harness/**",
        "**/assessments-p0/**",
        "**/interactive-book/**",
        "**/slide-deck/**",
        "**/interactive-video/**",
        "**/branching-scenario/**",
      ],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4173",
      },
    },
    {
      name: "telemetry-harness",
      testDir: "./tests/telemetry-harness",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4174",
      },
    },
    {
      name: "assessments-p0-vite",
      testDir: "./tests/assessments-p0",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4179",
      },
    },
    {
      name: "interactive-book-vite",
      testDir: "./tests/interactive-book",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4183",
      },
    },
    {
      name: "slide-deck-vite",
      testDir: "./tests/slide-deck",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4184",
      },
    },
    {
      name: "interactive-video-vite",
      testDir: "./tests/interactive-video",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4185",
      },
    },
    {
      name: "branching-scenario-vite",
      testDir: "./tests/branching-scenario",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4188",
      },
    },
  ],
  webServer: [
    {
      command: "npm run preview -w lessonkit-example-lxpack-golden -- --host 127.0.0.1 --port 4173",
      cwd: repoRoot,
      url: "http://127.0.0.1:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command:
        "npm run build -w lessonkit-e2e-telemetry-harness && npm run preview -w lessonkit-e2e-telemetry-harness -- --host 127.0.0.1 --port 4174",
      cwd: repoRoot,
      url: "http://127.0.0.1:4174",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command:
        "npm run build -w lessonkit-example-assessments-p0 && npm run preview -w lessonkit-example-assessments-p0 -- --host 127.0.0.1 --port 4179",
      cwd: repoRoot,
      url: "http://127.0.0.1:4179",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command:
        "npm run build -w lessonkit-example-interactive-book && npm run preview -w lessonkit-example-interactive-book -- --host 127.0.0.1 --port 4183",
      cwd: repoRoot,
      url: "http://127.0.0.1:4183",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command:
        "npm run build -w lessonkit-example-slide-deck && npm run preview -w lessonkit-example-slide-deck -- --host 127.0.0.1 --port 4184",
      cwd: repoRoot,
      url: "http://127.0.0.1:4184",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command:
        "npm run build -w lessonkit-example-interactive-video && npm run preview -w lessonkit-example-interactive-video -- --host 127.0.0.1 --port 4185",
      cwd: repoRoot,
      url: "http://127.0.0.1:4185",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command:
        "npm run build -w lessonkit-example-branching-scenario && npm run preview -w lessonkit-example-branching-scenario -- --host 127.0.0.1 --port 4188",
      cwd: repoRoot,
      url: "http://127.0.0.1:4188",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});

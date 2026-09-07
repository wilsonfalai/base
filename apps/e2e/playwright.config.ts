import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const webBaseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const serverEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  ),
);

export default defineConfig({
  globalSetup: "./global-setup.ts",
  testDir: "./tests",
  outputDir: "./test-results",
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: webBaseUrl,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter api dev",
      cwd: repositoryRoot,
      env: { ...serverEnvironment, NODE_ENV: "test" },
      url: `${process.env.E2E_API_BASE_URL ?? "http://localhost:3001"}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: "pnpm --filter web dev",
      cwd: repositoryRoot,
      env: { ...serverEnvironment, NODE_ENV: "development" },
      url: `${webBaseUrl}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});

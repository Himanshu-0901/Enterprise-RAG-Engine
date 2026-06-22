import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";

export default defineConfig({
  expect: { timeout: 10_000 },
  fullyParallel: false,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  reporter: [["list"]],
  testDir: "apps/web/e2e",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  webServer: {
    command: "docker compose up -d api web worker",
    reuseExistingServer: true,
    timeout: 120_000,
    url: baseURL
  }
});

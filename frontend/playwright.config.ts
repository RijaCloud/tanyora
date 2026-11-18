import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const profileAuthFile = path.join(__dirname, "tests", ".auth", "profile-user.json");
const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const localServer = !process.env.E2E_BASE_URL
  ? {
      command: "pnpm dev",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    }
  : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: localServer,
  projects: [
    {
      name: "setup-profile-auth",
      testMatch: /.*profile-auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      dependencies: ["setup-profile-auth"],
      testIgnore: [/.*profile-auth\.setup\.ts/, /.*profile-theme-smoke\.spec\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      dependencies: ["setup-profile-auth"],
      testIgnore: [/.*profile-auth\.setup\.ts/, /.*profile-theme-smoke\.spec\.ts/],
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "firefox",
      dependencies: ["setup-profile-auth"],
      testIgnore: [/.*profile-auth\.setup\.ts/, /.*profile-theme-smoke\.spec\.ts/],
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      dependencies: ["setup-profile-auth"],
      testIgnore: [/.*profile-auth\.setup\.ts/, /.*profile-theme-smoke\.spec\.ts/],
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "staging-chromium",
      testIgnore: [/.*profile-auth\.setup\.ts/, /.*profile-theme-smoke\.spec\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "staging-firefox",
      testIgnore: [/.*profile-auth\.setup\.ts/, /.*profile-theme-smoke\.spec\.ts/],
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "staging-webkit",
      testIgnore: [/.*profile-auth\.setup\.ts/, /.*profile-theme-smoke\.spec\.ts/],
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "chromium-profile-auth",
      dependencies: ["setup-profile-auth"],
      testMatch: /.*profile-theme-smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: profileAuthFile },
    },
  ],
});

import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: "http://127.0.0.1:43817",
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
  },
  webServer: {
    command: process.env.TEST_PRODUCTION
      ? "npm run preview -- --port 43817 --strictPort"
      : "npm run dev -- --port 43817 --strictPort",
    url: "http://127.0.0.1:43817",
    reuseExistingServer: false,
  },
  reporter: "list",
});

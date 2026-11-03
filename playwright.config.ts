import { defineConfig, devices } from "@playwright/test";

// 다른 로컬 앱과 겹치지 않는 전용 포트 지정
const PORT = 3107;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    // 이미 떠 있는 다른 앱을 이 앱으로 오인하지 않도록 재사용 차단
    reuseExistingServer: false,
  },
});

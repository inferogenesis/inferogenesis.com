import { defineConfig } from '@playwright/test';

const baseURL = 'http://localhost:4321';

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    // --ignore-lock keeps preview in the foreground and off the dev lock file.
    command: 'pnpm preview --ignore-lock --host localhost --port 4321',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});

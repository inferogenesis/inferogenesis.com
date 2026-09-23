import { defineConfig } from '@playwright/test';

// Its own port, so a running `pnpm dev` on 4321 is never mistaken for the built site.
const port = 4329;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    // --ignore-lock keeps preview in the foreground and off the dev lock file.
    command: `pnpm preview --ignore-lock --host localhost --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
  },
});

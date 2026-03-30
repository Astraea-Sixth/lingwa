import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 900000,
  expect: { timeout: 600000 },
  retries: 0,
  use: {
    baseURL: 'http://localhost:3004',
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'cd webapp && npm run dev',
    port: 3004,
    timeout: 30000,
    reuseExistingServer: true,
  },
})

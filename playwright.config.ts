import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./src/reporter/ai-reporter.ts'],
  ],
  projects: [
    {
      name: 'generated',
      testMatch: /generated\/.*\.spec\.ts/,
      use: {
        baseURL: process.env.TARGET_URL ?? 'https://jsonplaceholder.typicode.com',
      },
    },
  ],
});
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

/**
 * Minimal Playwright E2E Test Configuration
 * Only runs E2E tests, ignores Jest tests
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/features/*.spec.ts',

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Retry on CI only */
  retries: 0,

  /* Use single worker for debugging */
  workers: 1,

  /* Reporter to use */
  reporter: 'line',

  /* Test settings */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:5175',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Don't start servers automatically for manual testing */
  // webServer: [], // Comment out for manual server management

  /* Test timeout */
  timeout: 30000,
  expect: {
    timeout: 10000
  },
});

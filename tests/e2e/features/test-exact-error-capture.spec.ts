/**
 * Exact Error Capture Test
 *
 * Capture the exact JavaScript error that causes React to unmount
 */

import { test, expect } from '@playwright/test';

test.describe('Exact Error Capture', () => {

  test('Capture the exact error during auth flow', async ({ page }) => {
    const errors: string[] = [];
    const rejections: string[] = [];

    // Capture all types of errors
    page.on('pageerror', (error) => {
      errors.push(`PAGE ERROR: ${error.message}\nStack: ${error.stack}`);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`CONSOLE ERROR: ${msg.text()}`);
      }
    });

    // Capture unhandled rejections
    await page.addInitScript(() => {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('UNHANDLED_REJECTION:', event.reason);
      });

      window.addEventListener('error', (event) => {
        console.error('GLOBAL_ERROR:', event.error?.message, event.error?.stack);
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('=== Starting authentication flow ===');

    // Fill form
    await page.fill('[data-testid="email-input"]', 'sa_tester@example.com');
    await page.fill('[data-testid="password-input"]', 'NBZ8vxy0fbh@twm!xkg');

    // Submit and wait for crash
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000); // Wait for crash

    console.log('\n=== CAPTURED ERRORS ===');
    errors.forEach((error, index) => {
      console.log(`ERROR ${index + 1}:`, error);
    });

    console.log('\n=== CAPTURED REJECTIONS ===');
    rejections.forEach((rejection, index) => {
      console.log(`REJECTION ${index + 1}:`, rejection);
    });

    // Check React root status
    const hasReactRoot = await page.locator('#root').isVisible();
    console.log('\nReact root exists after errors:', hasReactRoot);

    if (!hasReactRoot) {
      const bodyContent = await page.locator('body').innerHTML();
      console.log('Body content after crash:', bodyContent);
    }

    // The test should capture the error that causes the crash
    expect(errors.length).toBeGreaterThan(0);
  });

  test('Test with error boundary simulation', async ({ page }) => {
    // Add a global error boundary to capture React errors
    await page.addInitScript(() => {
      const originalComponentDidCatch = console.error;

      // Intercept React error boundary logs
      console.error = (...args) => {
        if (args.some(arg => typeof arg === 'string' && (
          arg.includes('Consider adding an error boundary') ||
          arg.includes('The above error occurred') ||
          arg.includes('componentDidCatch')
        ))) {
          console.log('REACT_ERROR_BOUNDARY:', args.join(' '));
        }
        return originalComponentDidCatch.apply(console, args);
      };
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.fill('[data-testid="email-input"]', 'sa_tester@example.com');
    await page.fill('[data-testid="password-input"]', 'NBZ8vxy0fbh@twm!xkg');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const hasReactRoot = await page.locator('#root').isVisible();
    console.log('React root exists with error boundary test:', hasReactRoot);
  });

});

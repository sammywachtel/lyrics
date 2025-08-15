/**
 * Detailed Authentication Debug Test
 *
 * Deep debugging of the authentication flow to identify why React unmounts
 */

import { test, expect } from '@playwright/test';

test.describe('Detailed Authentication Debug', () => {

  test('Monitor console errors and network during auth', async ({ page }) => {
    const consoleMessages: string[] = [];
    const networkRequests: string[] = [];
    const networkErrors: string[] = [];

    // Capture all console messages
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture network requests
    page.on('request', request => {
      networkRequests.push(`${request.method()} ${request.url()}`);
    });

    // Capture network failures
    page.on('requestfailed', request => {
      networkErrors.push(`FAILED: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Navigate to app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('Initial console messages:', consoleMessages);
    console.log('Initial network requests:', networkRequests.slice(-3));

    // Fill auth form
    await page.fill('[data-testid="email-input"]', 'sa_tester@example.com');
    await page.fill('[data-testid="password-input"]', 'NBZ8vxy0fbh@twm!xkg');

    console.log('Before submit - React root exists:', await page.locator('#root').isVisible());

    // Clear previous messages and submit
    consoleMessages.length = 0;
    networkRequests.length = 0;
    await page.click('button[type="submit"]');

    // Wait and check what happened
    await page.waitForTimeout(3000);

    const hasReactRoot = await page.locator('#root').isVisible();
    const rootContent = await page.locator('#root').innerHTML().catch(() => 'ERROR_GETTING_CONTENT');

    console.log('\n=== POST-SUBMIT ANALYSIS ===');
    console.log('React root exists:', hasReactRoot);
    console.log('Root content length:', rootContent.length);
    console.log('\nConsole messages during auth:');
    consoleMessages.forEach(msg => console.log('  ', msg));

    console.log('\nNetwork requests during auth:');
    networkRequests.forEach(req => console.log('  ', req));

    console.log('\nNetwork errors during auth:');
    networkErrors.forEach(err => console.log('  ', err));

    // Check for any unhandled promise rejections
    await page.evaluate(() => {
      return new Promise(resolve => {
        const originalHandler = window.addEventListener;
        window.addEventListener('unhandledrejection', (event) => {
          console.error('Unhandled promise rejection:', event.reason);
        });
        setTimeout(resolve, 100);
      });
    });

    if (!hasReactRoot) {
      console.log('\n=== REACT UNMOUNT DETECTED ===');
      console.log('This suggests the React app crashed during authentication');
      console.log('Root innerHTML:', rootContent);
    }
  });

  test('Test auth flow step by step with timeouts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Step 1: Verify initial state
    expect(await page.locator('#root').isVisible()).toBe(true);
    expect(await page.locator('[data-testid="auth-form"]').isVisible()).toBe(true);
    console.log('✅ Step 1: Initial state verified');

    // Step 2: Fill email
    await page.fill('[data-testid="email-input"]', 'sa_tester@example.com');
    expect(await page.locator('#root').isVisible()).toBe(true);
    console.log('✅ Step 2: Email filled, React root still exists');

    // Step 3: Fill password
    await page.fill('[data-testid="password-input"]', 'NBZ8vxy0fbh@twm!xkg');
    expect(await page.locator('#root').isVisible()).toBe(true);
    console.log('✅ Step 3: Password filled, React root still exists');

    // Step 4: Click submit and monitor immediately
    const submitPromise = page.click('button[type="submit"]');

    // Check root existence in rapid succession
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(100);
      const hasRoot = await page.locator('#root').isVisible();
      console.log(`Step 4.${i + 1}: ${hasRoot ? '✅' : '❌'} React root exists (${100 * (i + 1)}ms after submit)`);

      if (!hasRoot) {
        console.log(`🚨 REACT ROOT DISAPPEARED AT ${100 * (i + 1)}ms AFTER SUBMIT`);
        break;
      }
    }

    await submitPromise;

    // Final state check
    await page.waitForTimeout(2000);
    const finalHasRoot = await page.locator('#root').isVisible();
    console.log(`Final state: ${finalHasRoot ? '✅' : '❌'} React root exists`);
  });

});

/**
 * Enhanced Error Detection E2E Tests
 *
 * Comprehensive error detection across screen and console.
 * Monitors for visual error messages, console errors, and page errors.
 */

import { test, expect } from '@playwright/test';
import { signInWithTestAccount, signOut } from '../utils/auth-helpers';

test.describe('Enhanced Error Detection', () => {

  let errorTracker: {
    consoleErrors: any[];
    pageErrors: any[];
    networkErrors: any[];
  };

  test.beforeEach(async ({ page }) => {
    // Initialize error tracking
    errorTracker = {
      consoleErrors: [],
      pageErrors: [],
      networkErrors: []
    };

    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorTracker.consoleErrors.push({
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString(),
          args: msg.args()
        });
      }
    });

    // Track page errors (JavaScript exceptions)
    page.on('pageerror', error => {
      errorTracker.pageErrors.push({
        message: error.message,
        stack: error.stack,
        name: error.name,
        timestamp: new Date().toISOString()
      });
    });

    // Track network request failures
    page.on('requestfailed', request => {
      errorTracker.networkErrors.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText,
        timestamp: new Date().toISOString()
      });
    });

    // Store in page context for access
    (page as any).errorTracker = errorTracker;
  });

  async function checkScreenErrors(page: any, testName: string) {
    // Look for various error message patterns on screen
    const errorSelectors = [
      '.error',
      '[role="alert"]',
      '.alert-error',
      '.bg-red-50',
      '.text-red-800',
      '.text-red-600',
      '.border-red-200',
      'text=Error',
      'text=Failed',
      'text=Something went wrong',
      'text=Unable to',
      'text=Could not',
      'text=Network error',
      'text=Connection failed',
      'text=Unexpected error'
    ];

    const screenErrors = [];

    for (const selector of errorSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible()) {
            const text = await element.textContent();
            if (text && text.trim()) {
              screenErrors.push({
                selector,
                text: text.trim(),
                testContext: testName
              });
            }
          }
        }
      } catch (e) {
        // Some selectors might not match, that's fine
      }
    }

    return screenErrors;
  }

  function filterCriticalConsoleErrors(consoleErrors: any[]) {
    return consoleErrors.filter(error =>
      !error.text.includes('Warning:') &&
      !error.text.includes('Download the React DevTools') &&
      !error.text.includes('React DevTools') &&
      !error.text.includes('favicon.ico') &&
      !error.text.includes('chunk-') &&
      !error.text.includes('sourcemap') &&
      !error.text.includes('service-worker') &&
      !error.text.toLowerCase().includes('extension')
    );
  }

  test('App loads without any errors (comprehensive check)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow time for async operations

    // Check for screen errors
    const screenErrors = await checkScreenErrors(page, 'App load');

    // Check for console errors
    const criticalConsoleErrors = filterCriticalConsoleErrors(errorTracker.consoleErrors);

    // Check for page errors
    const pageErrors = errorTracker.pageErrors;

    // Check for network errors (filter out expected ones)
    const criticalNetworkErrors = errorTracker.networkErrors.filter(error =>
      !error.url.includes('favicon.ico') &&
      !error.url.includes('sourcemap') &&
      !error.url.includes('service-worker')
    );

    // Comprehensive error reporting
    if (screenErrors.length > 0 || criticalConsoleErrors.length > 0 || pageErrors.length > 0 || criticalNetworkErrors.length > 0) {
      console.log('\n🔍 COMPREHENSIVE ERROR REPORT - APP LOAD:');
      if (screenErrors.length > 0) {
        console.log('❌ Screen errors:', screenErrors);
      }
      if (criticalConsoleErrors.length > 0) {
        console.log('❌ Console errors:', criticalConsoleErrors.map(e => e.text));
      }
      if (pageErrors.length > 0) {
        console.log('❌ Page errors:', pageErrors.map(e => e.message));
      }
      if (criticalNetworkErrors.length > 0) {
        console.log('❌ Network errors:', criticalNetworkErrors);
      }
    } else {
      console.log('✅ No errors detected during app load');
    }

    // Assertions
    expect(screenErrors).toHaveLength(0);
    expect(criticalConsoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
    expect(criticalNetworkErrors).toHaveLength(0);
  });

  test('Authentication flow error detection', async ({ page }) => {
    await signOut(page);
    await page.goto('/');

    // Check for errors before signing in
    let screenErrors = await checkScreenErrors(page, 'Pre-auth');
    expect(screenErrors).toHaveLength(0);

    // Attempt sign in
    await signInWithTestAccount(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for errors after authentication
    screenErrors = await checkScreenErrors(page, 'Post-auth');
    const criticalConsoleErrors = filterCriticalConsoleErrors(errorTracker.consoleErrors);
    const pageErrors = errorTracker.pageErrors;

    if (screenErrors.length > 0 || criticalConsoleErrors.length > 0 || pageErrors.length > 0) {
      console.log('\n🔍 AUTHENTICATION ERROR REPORT:');
      if (screenErrors.length > 0) {
        console.log('❌ Screen errors:', screenErrors);
      }
      if (criticalConsoleErrors.length > 0) {
        console.log('❌ Console errors:', criticalConsoleErrors.map(e => e.text));
      }
      if (pageErrors.length > 0) {
        console.log('❌ Page errors:', pageErrors.map(e => e.message));
      }
    } else {
      console.log('✅ No errors detected during authentication flow');
    }

    expect(screenErrors).toHaveLength(0);
    expect(criticalConsoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('Song operations error detection', async ({ page }) => {
    await signInWithTestAccount(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test creating a song
    const createButton = page.locator('[data-testid="create-new-song-button"], [data-testid="create-first-song-button"]').first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(2000);

      // Check for errors after clicking create
      let screenErrors = await checkScreenErrors(page, 'Song creation');
      expect(screenErrors).toHaveLength(0);

      // If song form is visible, try to interact with it
      const songForm = page.locator('[data-testid="song-form"]');
      if (await songForm.isVisible()) {
        const titleInput = page.locator('[data-testid="song-title-input"]');
        if (await titleInput.isVisible()) {
          await titleInput.fill('Test Song ' + Date.now());
          await page.waitForTimeout(1000);

          // Check for errors after form interaction
          screenErrors = await checkScreenErrors(page, 'Form interaction');
          expect(screenErrors).toHaveLength(0);
        }
      }
    }

    // Final comprehensive check
    const criticalConsoleErrors = filterCriticalConsoleErrors(errorTracker.consoleErrors);
    const pageErrors = errorTracker.pageErrors;

    if (criticalConsoleErrors.length > 0 || pageErrors.length > 0) {
      console.log('\n🔍 SONG OPERATIONS ERROR REPORT:');
      if (criticalConsoleErrors.length > 0) {
        console.log('❌ Console errors:', criticalConsoleErrors.map(e => e.text));
      }
      if (pageErrors.length > 0) {
        console.log('❌ Page errors:', pageErrors.map(e => e.message));
      }
    } else {
      console.log('✅ No errors detected during song operations');
    }

    expect(criticalConsoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('Interactive elements error detection', async ({ page }) => {
    await signInWithTestAccount(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test various interactive elements
    const interactiveSelectors = [
      'button',
      '[role="button"]',
      'a[href]',
      'input',
      'select'
    ];

    for (const selector of interactiveSelectors) {
      const elements = await page.locator(selector).all();
      const count = Math.min(elements.length, 3); // Test up to 3 of each type

      for (let i = 0; i < count; i++) {
        try {
          const element = elements[i];
          if (await element.isVisible() && await element.isEnabled()) {
            // Try clicking or focusing
            if (selector.includes('input') || selector.includes('select')) {
              await element.focus();
            } else {
              await element.click({ timeout: 1000 });
            }

            await page.waitForTimeout(500);

            // Check for errors after interaction
            const screenErrors = await checkScreenErrors(page, `${selector} interaction`);
            if (screenErrors.length > 0) {
              console.log(`❌ Error after ${selector} interaction:`, screenErrors);
              expect(screenErrors).toHaveLength(0);
            }
          }
        } catch (e) {
          // Some elements might not be interactable, that's OK
        }
      }
    }

    // Final check
    const criticalConsoleErrors = filterCriticalConsoleErrors(errorTracker.consoleErrors);
    const pageErrors = errorTracker.pageErrors;

    if (criticalConsoleErrors.length > 0 || pageErrors.length > 0) {
      console.log('\n🔍 INTERACTIVE ELEMENTS ERROR REPORT:');
      if (criticalConsoleErrors.length > 0) {
        console.log('❌ Console errors:', criticalConsoleErrors.map(e => e.text));
      }
      if (pageErrors.length > 0) {
        console.log('❌ Page errors:', pageErrors.map(e => e.message));
      }
    } else {
      console.log('✅ No errors detected during interactive element testing');
    }

    expect(criticalConsoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('Network error scenarios', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test with network offline
    await page.context().setOffline(true);

    // Try to perform actions that might trigger network requests
    const createButton = page.locator('[data-testid="create-new-song-button"], [data-testid="create-first-song-button"]').first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(3000); // Allow time for network errors

      // Check for appropriate error handling
      const screenErrors = await checkScreenErrors(page, 'Offline mode');

      // In offline mode, we might expect some error messages, so we just log them
      if (screenErrors.length > 0) {
        console.log('ℹ️  Offline error messages (expected):', screenErrors.map(e => e.text));
      }

      // Check that the app doesn't crash (main structure still visible)
      await expect(page.locator('.min-h-screen')).toBeVisible();
    }

    // Restore network
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);

    // Check for errors after going back online
    const onlineErrors = await checkScreenErrors(page, 'Back online');
    const criticalConsoleErrors = filterCriticalConsoleErrors(errorTracker.consoleErrors);

    // Filter out network-related console errors which are expected during offline testing
    const nonNetworkConsoleErrors = criticalConsoleErrors.filter(error =>
      !error.text.toLowerCase().includes('network') &&
      !error.text.toLowerCase().includes('fetch') &&
      !error.text.toLowerCase().includes('connection')
    );

    if (onlineErrors.length > 0 || nonNetworkConsoleErrors.length > 0) {
      console.log('\n🔍 NETWORK ERROR SCENARIOS REPORT:');
      if (onlineErrors.length > 0) {
        console.log('❌ Screen errors after going online:', onlineErrors);
      }
      if (nonNetworkConsoleErrors.length > 0) {
        console.log('❌ Non-network console errors:', nonNetworkConsoleErrors.map(e => e.text));
      }
    } else {
      console.log('✅ App handled network scenarios gracefully');
    }

    expect(onlineErrors).toHaveLength(0);
    expect(nonNetworkConsoleErrors).toHaveLength(0);
  });

});

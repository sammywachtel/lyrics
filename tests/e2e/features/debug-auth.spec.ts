/**
 * Debug Authentication Issues
 *
 * Temporary test file to debug authentication flow issues
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Debug', () => {

  test('Check app state before any authentication', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check initial app state
    const hasReactRoot = await page.locator('#root').isVisible();
    const hasAuthForm = await page.locator('[data-testid="auth-form"]').isVisible();
    const bodyContent = await page.locator('body').innerHTML();

    console.log('Initial app state:', {
      hasReactRoot,
      hasAuthForm,
      bodyLength: bodyContent.length
    });

    expect(hasReactRoot).toBeTruthy();
    expect(hasAuthForm).toBeTruthy();
  });

  test('Check what happens during authentication form interaction', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fill in auth form but don't submit yet
    await page.fill('[data-testid="email-input"]', 'sa_tester@example.com');
    await page.fill('[data-testid="password-input"]', 'NBZ8vxy0fbh@twm!xkg');

    // Check state before submit
    console.log('Before submit - React root exists:', await page.locator('#root').isVisible());

    // Submit form
    await page.click('button[type="submit"]');

    // Wait a bit and check state
    await page.waitForTimeout(3000);

    const hasReactRoot = await page.locator('#root').isVisible();
    const hasAuthForm = await page.locator('[data-testid="auth-form"]').isVisible();
    const hasSongList = await page.locator('[data-testid="song-list"]').isVisible();
    const bodyContent = await page.locator('body').innerHTML();

    console.log('After submit state:', {
      hasReactRoot,
      hasAuthForm,
      hasSongList,
      bodyLength: bodyContent.length
    });

    // Log any console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    console.log('Console errors during auth:', errors);

    if (!hasReactRoot) {
      console.log('CRITICAL: React root disappeared during authentication!');
      console.log('Body content:', bodyContent.substring(0, 500));
    }
  });

  test('Direct test of app state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if app is accessible
    const appState = await page.evaluate(() => {
      // Check if React is working
      return document.querySelector('#root') ? 'React App Loaded' : 'React App Not Found';
    });

    console.log('App status:', appState);

    // Try to check React app directly
    const appCheck = await page.evaluate(() => {
      try {
        // Check if React components are still mounted
        const reactRoot = document.getElementById('root');
        const hasContent = reactRoot && reactRoot.innerHTML.length > 0;

        return {
          hasRoot: !!reactRoot,
          hasContent,
          innerHTML: reactRoot ? reactRoot.innerHTML.substring(0, 200) : 'No root'
        };
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log('React app status:', appCheck);
  });

});

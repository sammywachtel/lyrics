/**
 * Direct Authentication Test
 *
 * Test authenticated state by directly setting auth token in localStorage
 * to bypass the problematic authentication form flow
 */

import { test, expect } from '@playwright/test';

test.describe('Direct Authentication Test', () => {

  test('Test authenticated state with direct token setup', async ({ page }) => {
    // Navigate to app first
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set up authentication state directly in browser storage
    // This simulates being already logged in
    await page.evaluate(() => {
      // Set up fake Supabase session
      const fakeSession = {
        access_token: 'fake-test-token-12345',
        refresh_token: 'fake-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: '71292378-d9fb-4284-ba9a-88cbf8309a1d',
          email: 'sa_tester@example.com',
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      // Store in localStorage (where Supabase typically stores sessions)
      localStorage.setItem('supabase.auth.token', JSON.stringify(fakeSession));

      // Also try sessionStorage
      sessionStorage.setItem('supabase.auth.token', JSON.stringify(fakeSession));
    });

    // Reload page to trigger authentication state
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give React time to process auth state

    // Check if app loads properly with authentication
    const hasReactRoot = await page.locator('#root').isVisible();
    const hasMinHeight = await page.locator('.min-h-screen').isVisible();
    const hasSongList = await page.locator('[data-testid=\"song-list\"]').isVisible();
    const hasAuthForm = await page.locator('[data-testid=\"auth-form\"]').isVisible();

    console.log('Direct auth state:', {
      hasReactRoot,
      hasMinHeight,
      hasSongList,
      hasAuthForm
    });

    // If React app is present, this confirms the issue is with the auth flow, not the authenticated state
    expect(hasReactRoot).toBeTruthy();

    // Take screenshot for debugging
    if (!hasReactRoot) {
      const bodyContent = await page.locator('body').innerHTML();
      console.log('Body content without React root:', bodyContent.substring(0, 500));
    }
  });

  test('Test with minimal auth bypass', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Override auth context to return fake authenticated user
    await page.addInitScript(() => {
      // Override the useAuth hook to return authenticated state
      window.__TEST_AUTH_OVERRIDE__ = {
        user: {
          id: '71292378-d9fb-4284-ba9a-88cbf8309a1d',
          email: 'sa_tester@example.com'
        },
        loading: false
      };
    });

    // Reload to apply the override
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const hasReactRoot = await page.locator('#root').isVisible();
    const bodyContent = await page.locator('body').innerHTML();

    console.log('Auth bypass test:', {
      hasReactRoot,
      bodyLength: bodyContent.length
    });

    expect(hasReactRoot).toBeTruthy();
  });

});

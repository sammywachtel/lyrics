/**
 * Authentication helpers for E2E tests
 *
 * Provides utilities for logging in with test accounts and managing
 * authentication state during E2E test execution.
 */

import { Page, expect } from '@playwright/test';

export interface TestCredentials {
  email: string;
  password: string;
}

/**
 * Get test account credentials from environment variables
 */
export function getTestCredentials(): TestCredentials {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Test credentials not configured. Please set TEST_EMAIL and TEST_PASSWORD in .env.test file.'
    );
  }

  return { email, password };
}

/**
 * Get admin test account credentials from environment variables
 */
export function getAdminTestCredentials(): TestCredentials {
  const email = process.env.ADMIN_TEST_EMAIL;
  const password = process.env.ADMIN_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Admin test credentials not configured. Please set ADMIN_TEST_EMAIL and ADMIN_TEST_PASSWORD in .env.test file.'
    );
  }

  return { email, password };
}

/**
 * Sign in with test account credentials with error checking
 */
export async function signInWithTestAccount(page: Page, credentials?: TestCredentials): Promise<void> {
  const { email, password } = credentials || getTestCredentials();

  // Navigate to app (will show auth form if not authenticated)
  await page.goto('/');

  // Wait for auth form or already authenticated state
  await page.waitForSelector('[data-testid="auth-form"], [data-testid="song-list"]', { timeout: 10000 });

  // Check if already authenticated
  const isAlreadyAuthenticated = await page.locator('[data-testid="song-list"]').isVisible({ timeout: 1000 });
  if (isAlreadyAuthenticated) {
    return; // Already signed in
  }

  // Look for auth form
  const authForm = page.locator('[data-testid="auth-form"]');
  await expect(authForm).toBeVisible();

  // Check for any pre-existing errors on the auth form
  const preErrors = await page.locator('.error, [role="alert"], .alert-error, .bg-red-50, .text-red-800').all();
  for (const errorEl of preErrors) {
    if (await errorEl.isVisible()) {
      const errorText = await errorEl.textContent();
      if (errorText && errorText.trim()) {
        console.warn('⚠️  Pre-existing auth error:', errorText.trim());
      }
    }
  }

  // Make sure we're in sign-in mode (not sign-up)
  const signInTab = page.locator('text=Sign In').first();
  if (await signInTab.isVisible()) {
    await signInTab.click();
  }

  // Fill in credentials
  await page.fill('[data-testid="email-input"], input[type="email"]', email);
  await page.fill('[data-testid="password-input"], input[type="password"]', password);

  // Submit form
  const signInButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();
  await signInButton.click();

  // Wait a moment and check for authentication errors
  await page.waitForTimeout(2000);

  const authErrors = await page.locator('.error, [role="alert"], .alert-error, .bg-red-50, .text-red-800').all();
  const visibleAuthErrors = [];

  for (const errorEl of authErrors) {
    if (await errorEl.isVisible()) {
      const errorText = await errorEl.textContent();
      if (errorText && errorText.trim()) {
        visibleAuthErrors.push(errorText.trim());
      }
    }
  }

  if (visibleAuthErrors.length > 0) {
    throw new Error(`Authentication failed with errors: ${visibleAuthErrors.join(', ')}`);
  }

  // Wait for successful authentication (should navigate to song list)
  console.log('🔄 Waiting for post-authentication navigation...');

  try {
    // Wait for either song list or any non-auth screen
    await page.waitForSelector('[data-testid="song-list"], .min-h-screen:not(:has([data-testid="auth-form"]))', {
      timeout: 15000
    });

    // Additional check - wait for auth form to disappear
    await page.waitForSelector('[data-testid="auth-form"]', {
      state: 'hidden',
      timeout: 5000
    });

    console.log('✅ Successfully authenticated with test account');

  } catch (error) {
    console.log('❌ Authentication timeout - capturing debug info');

    // Debug info: check what's actually on the page
    const url = page.url();
    const hasAuthForm = await page.locator('[data-testid="auth-form"]').isVisible();
    const hasSongList = await page.locator('[data-testid="song-list"]').isVisible();
    const hasMinHeight = await page.locator('.min-h-screen').isVisible();
    const errorMessages = await page.locator('.error, [role="alert"], .bg-red-50').allTextContents();

    // Check for loading states
    const hasLoadingSpinner = await page.locator('.animate-spin').isVisible();
    const hasLoadingText = await page.locator('text=Loading').isVisible();

    // Check for any content at all
    const bodyContent = await page.locator('body').innerHTML();
    const hasReactRoot = await page.locator('#root').isVisible();
    const rootContent = await page.locator('#root').innerHTML().catch(() => 'Not found');

    // Check console errors
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      return errors;
    });

    console.log('Debug info:', {
      url,
      hasAuthForm,
      hasSongList,
      hasMinHeight,
      errorMessages,
      hasLoadingSpinner,
      hasLoadingText,
      hasReactRoot,
      rootContentLength: rootContent.length,
      consoleErrors
    });

    // If React root exists but no content, log the root content
    if (hasReactRoot && rootContent.length < 500) {
      console.log('React root content:', rootContent);
    }

    throw error;
  }
}

/**
 * Sign out of the application
 */
export async function signOut(page: Page): Promise<void> {
  // Look for sign out button (could be in header, menu, etc.)
  const signOutButton = page.locator('button:has-text("Sign Out"), [data-testid="sign-out-button"]').first();

  if (await signOutButton.isVisible({ timeout: 5000 })) {
    await signOutButton.click();

    // Wait for auth form to appear
    await page.waitForSelector('[data-testid="auth-form"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();
  }
}

/**
 * Check if user is currently authenticated with error detection
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto('/');
  await page.waitForSelector('[data-testid="auth-form"], [data-testid="song-list"], .min-h-screen', {
    timeout: 10000
  });

  // Check for any error messages that might indicate auth issues
  const authCheckErrors = await page.locator('.error, [role="alert"], .alert-error, .bg-red-50, .text-red-800').all();
  const visibleErrors = [];

  for (const errorEl of authCheckErrors) {
    if (await errorEl.isVisible()) {
      const errorText = await errorEl.textContent();
      if (errorText && errorText.trim()) {
        visibleErrors.push(errorText.trim());
      }
    }
  }

  if (visibleErrors.length > 0) {
    console.warn('⚠️  Errors detected during authentication check:', visibleErrors);
  }

  const hasAuthForm = await page.locator('[data-testid="auth-form"]').isVisible({ timeout: 1000 });
  const authenticated = !hasAuthForm;

  console.log(`🔐 Authentication status: ${authenticated ? 'authenticated' : 'not authenticated'}`);
  return authenticated;
}

/**
 * Set up authenticated context for tests
 * Call this in beforeEach or beforeAll for tests that require authentication
 */
export async function setupAuthenticatedContext(page: Page): Promise<void> {
  const isAuth = await isAuthenticated(page);

  if (!isAuth) {
    await signInWithTestAccount(page);
  }
}

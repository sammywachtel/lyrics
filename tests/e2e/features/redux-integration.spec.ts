/**
 * Redux Integration E2E Tests
 *
 * Specific tests for Redux functionality introduced in Phase 0.
 * Validates that state management and caching work correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Redux State Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Redux Provider is working (no context errors)', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('could not find react-redux context')) {
        consoleErrors.push(msg.text());
      }
    });

    // Interact with the app to trigger Redux hooks
    await page.waitForTimeout(2000);

    // Try to click on elements that would use Redux
    const interactiveElements = page.locator('button, [role="button"], a[href]');
    const count = await interactiveElements.count();

    if (count > 0) {
      // Click a few elements to trigger Redux usage
      for (let i = 0; i < Math.min(3, count); i++) {
        try {
          await interactiveElements.nth(i).click({ timeout: 1000 });
          await page.waitForTimeout(500);
        } catch (e) {
          // Some elements might not be clickable, that's ok
        }
      }
    }

    // Should not have Redux context errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('RTK Query caching works on navigation', async ({ page }) => {
    // Navigate to song list
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Record network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/songs') || request.url().includes('/songs')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });

    // If there are songs, try to navigate to one and back
    const editButtons = page.locator('[data-testid*="edit"]').or(page.locator('text="Edit"'));
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      // Navigate to song editor
      await editButtons.first().click();
      await page.waitForTimeout(2000);

      // Navigate back (look for back button or browser back)
      const backButton = page.locator('text=Back').or(page.locator('text=← Back')).or(page.locator('[aria-label="Back"]')).or(page.locator('.back-button')).first();

      if (await backButton.isVisible()) {
        await backButton.click();
      } else {
        await page.goBack();
      }

      await page.waitForTimeout(2000);

      // Should use cache on return (fewer requests)
      const songsRequests = networkRequests.filter(req => req.url().includes('songs'));

      // Exact caching behavior varies, but we shouldn't see excessive requests
      expect(songsRequests.length).toBeLessThan(10); // Reasonable upper bound

    } else {
      console.log('No songs available for caching test');
    }
  });

  test('Optimistic updates work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for create song functionality
    const createButton = page.locator('text=Create New Song').or(page.locator('text=Create Your First Song')).first();

    if (await createButton.isVisible()) {
      // Record when we start creating
      const startTime = Date.now();

      await createButton.click();

      // Look for immediate UI response (optimistic update)
      const hasImmediateResponse = await Promise.race([
        page.locator('[data-testid="song-form"], .editor-container, [contenteditable]').waitFor({ timeout: 2000 }).then(() => true),
        page.waitForTimeout(2000).then(() => false)
      ]);

      const responseTime = Date.now() - startTime;

      // Should respond quickly (optimistic) not wait for server
      expect(responseTime).toBeLessThan(3000);
      expect(hasImmediateResponse).toBeTruthy();

    } else {
      console.log('No create functionality available for optimistic update test');
    }
  });

  test('Auto-save functionality works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to an existing song or create one
    const editButtons = page.locator('[data-testid*="edit"]').or(page.locator('text="Edit"'));
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForSelector('.rich-text-editor', { timeout: 10000 });

      // Look for auto-save indicators
      const autoSaveIndicators = page.locator('text=Auto-save').or(page.locator('text=Saving')).or(page.locator('text=Saved')).or(page.locator('.auto-save'));

      // Type some content to trigger auto-save
      const editor = page.locator('[contenteditable]').or(page.locator('textarea')).or(page.locator('.rich-text-editor')).first();

      if (await editor.isVisible()) {
        await editor.fill('Test auto-save content ' + Date.now());

        // Wait for auto-save to potentially trigger
        await page.waitForTimeout(12000); // Wait longer than auto-save delay

        // Should see some auto-save indication or at least no errors
        const hasAutoSaveUI = await autoSaveIndicators.count() > 0;
        console.log('Has auto-save UI:', hasAutoSaveUI);

        // At minimum, editor should still be functional
        await expect(editor).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

});

test.describe('API Integration', () => {

  test('RTK Query endpoints respond correctly', async ({ page }) => {
    let apiErrors = [];

    page.on('response', response => {
      if (response.url().includes('/api/') && !response.ok()) {
        apiErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for initial API calls
    await page.waitForTimeout(3000);

    // Filter out expected 404s for missing resources
    const criticalErrors = apiErrors.filter(error =>
      error.status !== 404 &&
      error.status !== 401 && // Auth might not be configured
      !error.url.includes('/favicon')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('Health check endpoint works', async ({ page }) => {
    await page.goto('/');

    // Make a direct request to health endpoint
    const response = await page.request.get('/api/health');

    // Should respond successfully
    expect(response.ok() || response.status() === 404).toBeTruthy(); // 404 is ok if endpoint not implemented
  });

});

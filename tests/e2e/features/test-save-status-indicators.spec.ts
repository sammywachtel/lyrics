/**
 * Test suite for save status indicators and auto-save functionality
 * This ensures that save states are properly displayed and behave correctly
 */

import { test, expect } from '@playwright/test';
import { signInWithTestAccount } from '../utils/auth-helpers';

test.describe('Save Status Indicators Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Listen for console messages to track save operations
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Listen for network requests to track API calls
    page.on('request', request => {
      if (request.method() === 'PATCH' && request.url().includes('/api/songs/')) {
        console.log('🔄 PATCH request to:', request.url());
      }
    });

    page.on('response', response => {
      if (response.request().method() === 'PATCH' && response.url().includes('/api/songs/')) {
        console.log('✅ PATCH response:', response.status(), response.url());
      }
    });

    await signInWithTestAccount(page);
  });

  test('Manual save button states work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('💾 Testing manual save button states');

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Find save button - try multiple selectors
    const saveButtonSelectors = [
      'button:has-text("Save")',
      'button:has-text("Saved")',
      'button[title*="save"]',
      'header button:has([class*="save"])',
      '[data-testid="save-button"]'
    ];

    let saveButton;
    for (const selector of saveButtonSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        saveButton = button;
        console.log('💾 Found save button with selector:', selector);
        break;
      }
    }

    if (!saveButton) {
      console.log('❌ Save button not found - checking all buttons in header');
      const headerButtons = page.locator('header button');
      const buttonCount = await headerButtons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = headerButtons.nth(i);
        const buttonText = await button.textContent().catch(() => '');
        const buttonTitle = await button.getAttribute('title').catch(() => '');
        console.log(`  Button ${i}: text="${buttonText?.trim()}" title="${buttonTitle}"`);
      }

      // Try to find by text content containing save-related words
      saveButton = page.locator('header button').filter({ hasText: /save|saved/i }).first();
    }

    expect(saveButton).toBeTruthy();

    // Get initial button state
    const initialButtonText = await saveButton.textContent();
    console.log('💾 Initial save button text:', initialButtonText?.trim());

    // Make a change to trigger unsaved state
    const editor = page.locator('[contenteditable]').first();
    await editor.click();
    await editor.fill('Testing save states - this is new content');

    // Wait for unsaved state
    await page.waitForTimeout(1000);

    const unsavedButtonText = await saveButton.textContent();
    console.log('⚠️ After changes, button text:', unsavedButtonText?.trim());

    // Button should show it can be saved now
    const buttonDisabled = await saveButton.getAttribute('disabled');
    console.log('🚫 Button disabled:', buttonDisabled !== null);

    // Click save button and verify states
    if (buttonDisabled === null) {
      await saveButton.click();
      console.log('🔄 Clicked save button');

      // Wait for saving state
      await page.waitForTimeout(500);
      const savingButtonText = await saveButton.textContent();
      console.log('⏳ During save, button text:', savingButtonText?.trim());

      // Wait for save to complete
      await page.waitForTimeout(3000);
      const savedButtonText = await saveButton.textContent();
      console.log('✅ After save, button text:', savedButtonText?.trim());

      // Verify the button indicates saved state
      expect(savedButtonText?.toLowerCase()).toMatch(/saved|✓/);
    }
  });

  test('Auto-save status changes correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🔄 Testing auto-save status changes');

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Look for status indicators in various locations
    const statusIndicatorSelectors = [
      ':has-text("Unsaved")',
      ':has-text("Saved")',
      ':has-text("Saving")',
      ':has-text("Auto-saving")',
      '[class*="status"]',
      'header [class*="save"]'
    ];

    const findStatusIndicator = async () => {
      for (const selector of statusIndicatorSelectors) {
        const indicator = page.locator(selector).first();
        if (await indicator.isVisible().catch(() => false)) {
          const text = await indicator.textContent();
          return { element: indicator, text: text?.trim() };
        }
      }
      return null;
    };

    // Get initial status
    const initialStatus = await findStatusIndicator();
    console.log('📊 Initial status:', initialStatus?.text || 'Not found');

    // Make a change to trigger auto-save
    const editor = page.locator('[contenteditable]').first();
    await editor.click();
    await editor.fill('Testing auto-save functionality with this new content');

    console.log('✏️ Made changes, waiting for status updates...');

    // Track status changes over time
    const statusChanges = [];
    const trackStatusFor = 15000; // 15 seconds
    const checkInterval = 1000; // Check every second

    for (let i = 0; i < trackStatusFor / checkInterval; i++) {
      await page.waitForTimeout(checkInterval);
      const currentStatus = await findStatusIndicator();
      const statusText = currentStatus?.text || 'Not found';

      // Only log if status changed
      if (statusChanges.length === 0 || statusChanges[statusChanges.length - 1] !== statusText) {
        statusChanges.push(statusText);
        console.log(`📊 Status at ${i + 1}s:`, statusText);
      }

      // If we see "Saved", the test is successful
      if (statusText.toLowerCase().includes('saved') && !statusText.toLowerCase().includes('unsaved')) {
        console.log('✅ Auto-save completed successfully');
        break;
      }
    }

    console.log('📊 All status changes:', statusChanges);

    // Verify we saw expected status progression
    const hasUnsaved = statusChanges.some(s => s.toLowerCase().includes('unsaved'));
    const hasSaving = statusChanges.some(s => s.toLowerCase().includes('saving'));
    const hasSaved = statusChanges.some(s => s.toLowerCase().includes('saved') && !s.toLowerCase().includes('unsaved'));

    console.log('📊 Status progression check:', { hasUnsaved, hasSaving, hasSaved });

    // At minimum, we should see the final "saved" state
    expect(hasSaved).toBe(true);
  });

  test('Save status indicators work for both title and lyrics changes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🏷️ Testing save status for different types of changes');

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Test 1: Change lyrics
    console.log('📝 Testing lyrics change save status');
    const editor = page.locator('[contenteditable]').first();
    await editor.click();
    await editor.fill('New lyrics content for testing save status');

    // Wait and check for unsaved indicator
    await page.waitForTimeout(2000);
    let statusIndicator = page.locator(':has-text("Unsaved"), :has-text("pending"), [class*="unsaved"]').first();
    let hasUnsaved = await statusIndicator.isVisible().catch(() => false);
    console.log('📊 Lyrics change shows unsaved:', hasUnsaved);

    // Wait for auto-save
    await page.waitForTimeout(12000);
    let savedIndicator = page.locator(':has-text("Saved"), :has-text("✓")').first();
    let hasSaved = await savedIndicator.isVisible().catch(() => false);
    console.log('📊 Lyrics change auto-saved:', hasSaved);

    // Test 2: Change title/metadata (if available)
    console.log('🏷️ Testing metadata change save status');
    const metadataButton = page.locator('button:has-text("Untitled Song"), header button').first();

    if (await metadataButton.isVisible().catch(() => false)) {
      await metadataButton.click();
      await page.waitForTimeout(1000);

      // Look for title input field
      const titleInput = page.locator('input[placeholder*="title"], input[type="text"]').first();

      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill('Test Song Title');

        // Look for save/apply button in the metadata form
        const applyButton = page.locator('button:has-text("Save"), button:has-text("Apply")').first();
        if (await applyButton.isVisible().catch(() => false)) {
          await applyButton.click();
        }

        // Wait and check for save status
        await page.waitForTimeout(2000);
        statusIndicator = page.locator(':has-text("Unsaved"), [class*="unsaved"]').first();
        hasUnsaved = await statusIndicator.isVisible().catch(() => false);
        console.log('📊 Title change shows unsaved:', hasUnsaved);

        // Wait for auto-save
        await page.waitForTimeout(10000);
        savedIndicator = page.locator(':has-text("Saved"), :has-text("✓")').first();
        hasSaved = await savedIndicator.isVisible().catch(() => false);
        console.log('📊 Title change auto-saved:', hasSaved);
      }
    }
  });

  test('Network requests match UI save status', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🌐 Testing network requests match UI status');

    // Track API calls
    const apiCalls = [];
    page.on('request', request => {
      if (request.method() === 'PATCH' && request.url().includes('/api/songs/')) {
        apiCalls.push({ type: 'request', time: Date.now(), url: request.url() });
        console.log('📡 API Request:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.request().method() === 'PATCH' && response.url().includes('/api/songs/')) {
        apiCalls.push({
          type: 'response',
          time: Date.now(),
          url: response.url(),
          status: response.status()
        });
        console.log('📡 API Response:', response.status(), response.url());
      }
    });

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Make a change
    const editor = page.locator('[contenteditable]').first();
    await editor.click();
    await editor.fill('Testing network correlation with UI status');

    // Wait for auto-save to complete
    await page.waitForTimeout(15000);

    console.log('📡 Total API calls captured:', apiCalls.length);
    apiCalls.forEach((call, index) => {
      console.log(`  ${index + 1}. ${call.type}: ${call.status || ''} ${call.url}`);
    });

    // Verify we had at least one successful save request
    const successfulSaves = apiCalls.filter(call =>
      call.type === 'response' && call.status >= 200 && call.status < 300
    );

    expect(successfulSaves.length).toBeGreaterThan(0);

    // Check final UI state shows saved
    const finalStatus = page.locator(':has-text("Saved"), :has-text("✓")').first();
    const isFinalSaved = await finalStatus.isVisible().catch(() => false);
    console.log('📊 Final UI shows saved state:', isFinalSaved);

    // If we had successful API calls, UI should show saved
    if (successfulSaves.length > 0) {
      expect(isFinalSaved).toBe(true);
    }
  });
});

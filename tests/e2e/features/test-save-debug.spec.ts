/**
 * Debug test for save status flow
 */

import { test, expect } from '@playwright/test';
import { signInWithTestAccount } from '../utils/auth-helpers';

test.describe('Save Status Debug Tests', () => {

  test.beforeEach(async ({ page }) => {
    await signInWithTestAccount(page);
  });

  test('Debug save status flow step by step', async ({ page }) => {
    console.log('🔍 Debugging save status flow');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Check initial state
    console.log('1. Checking initial state...');
    const initialElements = await page.locator('*').filter({ hasText: /Save|Unsaved/i }).allTextContents();
    console.log('Initial save-related elements:', initialElements);

    // Make some changes
    console.log('2. Making changes...');
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('Test content for save debug');

    await page.waitForTimeout(2000);

    // Check unsaved state
    console.log('3. Checking unsaved state...');
    const unsavedElements = await page.locator('*').filter({ hasText: /Save|Unsaved/i }).allTextContents();
    console.log('Unsaved state elements:', unsavedElements);

    // Find and click save button
    console.log('4. Finding save button...');
    const saveButton = page.locator('button').filter({ hasText: /Save now|Save/i }).first();
    const saveButtonText = await saveButton.textContent();
    console.log('Save button text before click:', saveButtonText);

    // Click save
    console.log('5. Clicking save...');
    await saveButton.click();

    // Wait for save to complete
    await page.waitForTimeout(3000);

    // Check saved state
    console.log('6. Checking saved state...');
    const savedElements = await page.locator('*').filter({ hasText: /Save|Unsaved/i }).allTextContents();
    console.log('After save elements:', savedElements);

    // Check save button text after save
    const saveButtonTextAfter = await saveButton.textContent().catch(() => 'button not found');
    console.log('Save button text after save:', saveButtonTextAfter);

    // Look for specific saved indicators
    const savedIndicators = await page.locator('text=Saved').allTextContents();
    console.log('Saved indicators found:', savedIndicators);

    // Check for any ✓ symbols
    const checkmarks = await page.locator('text=✓').allTextContents();
    console.log('Checkmark symbols found:', checkmarks);

    // Take screenshot for manual inspection
    await page.screenshot({
      path: 'test-results/save-debug.png',
      fullPage: true
    });

    console.log('✅ Debug save status flow complete');
  });
});

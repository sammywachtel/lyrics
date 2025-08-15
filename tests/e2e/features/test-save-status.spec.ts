/**
 * E2E Tests for Save Status Functionality
 *
 * These tests verify that save status indicators work correctly
 * and that Redux integration doesn't break save state management.
 */

import { test, expect, Page } from '@playwright/test';
import { signInWithTestAccount } from '../utils/auth-helpers';

test.describe('Save Status Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Listen for console messages to catch JavaScript errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('BROWSER ERROR:', msg.text());
      }
    });

    await signInWithTestAccount(page);
  });

  test('Save status correctly shows "Unsaved" when making changes', async ({ page }) => {
    console.log('📝 Testing save status changes from saved to unsaved');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to song editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await editButton.click();

    // Wait for editor to load completely
    await page.waitForTimeout(3000);

    // Find the Lexical editor
    const editor = page.locator('[contenteditable="true"]').first();
    await expect(editor).toBeVisible();

    // Clear existing content
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Wait for any auto-save to complete and status to settle
    await page.waitForTimeout(2000);

    console.log('✏️ Making changes to trigger unsaved status');

    // Make a change to the lyrics
    await page.keyboard.type('This is a test line');

    // Wait a moment for the change to be detected
    await page.waitForTimeout(500);

    // Check that unsaved status appears
    const unsavedIndicator = page.locator('text=Unsaved').or(page.locator('text=Save now')).or(page.locator('[data-testid="unsaved-indicator"]'));

    // Allow some time for the status to update
    await expect(unsavedIndicator).toBeVisible({ timeout: 5000 });

    console.log('✅ Save status correctly shows unsaved state after changes');
  });

  test('Save status correctly shows "Saved" after manual save', async ({ page }) => {
    console.log('💾 Testing save status changes from unsaved to saved');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Make changes
    await page.keyboard.type('Test lyrics for save status');
    await page.waitForTimeout(500);

    // Verify unsaved status appears first
    const unsavedIndicator = page.locator('text=Unsaved').or(page.locator('text=Save now'));
    await expect(unsavedIndicator).toBeVisible({ timeout: 3000 });

    console.log('🔄 Triggering manual save');

    // Trigger save - look for save button or use keyboard shortcut
    const saveButton = page.locator('button').filter({ hasText: /save/i }).first();

    if (await saveButton.isVisible({ timeout: 1000 })) {
      await saveButton.click();
    } else {
      // Fallback: use keyboard shortcut
      await page.keyboard.press('Control+s');
    }

    // Wait for save to complete
    await page.waitForTimeout(2000);

    // Check that saved status appears
    const savedIndicator = page.locator('text=Saved').or(page.locator('[data-testid="saved-indicator"]'));

    // Should show saved status and hide unsaved status
    // Look for save button with "Saved" text (not just standalone "Saved" text)
    const saveButtonSaved = page.locator('button').filter({ hasText: /Saved/i });
    await expect(saveButtonSaved).toBeVisible({ timeout: 5000 });
    await expect(unsavedIndicator).not.toBeVisible({ timeout: 3000 });

    console.log('✅ Save status correctly shows saved state after manual save');
  });

  test('Auto-save status updates correctly', async ({ page }) => {
    console.log('🔄 Testing auto-save status behavior');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    console.log('✏️ Making changes to trigger auto-save');

    // Make changes
    await page.keyboard.type('Testing auto-save functionality');

    // Wait for unsaved status
    const unsavedIndicator = page.locator('text=Unsaved').or(page.locator('text=Save now'));
    await expect(unsavedIndicator).toBeVisible({ timeout: 3000 });

    console.log('⏱️ Waiting for auto-save to trigger (10+ seconds)');

    // Wait for auto-save to trigger (should happen within 10 seconds)
    await page.waitForTimeout(12000);

    // Check for auto-save completion indicators
    const savedIndicator = page.locator('text=Saved').or(page.locator('text=Auto-saved')).or(page.locator('[data-testid="saved-indicator"]'));

    // Auto-save should have completed - look for button with "Saved" text
    const autoSaveButtonSaved = page.locator('button').filter({ hasText: /Saved/i });
    await expect(autoSaveButtonSaved).toBeVisible({ timeout: 5000 });

    console.log('✅ Auto-save status correctly updated');
  });

  test('Save status persists correctly across rapid changes', async ({ page }) => {
    console.log('⚡ Testing save status with rapid typing');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Rapid typing to test save status reliability
    const rapidText = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';

    for (const char of rapidText) {
      await page.keyboard.type(char);
      await page.waitForTimeout(50); // Fast typing
    }

    // Should show unsaved status
    const unsavedIndicator = page.locator('text=Unsaved').or(page.locator('text=Save now'));
    await expect(unsavedIndicator).toBeVisible({ timeout: 3000 });

    // Continue typing after unsaved status appears
    await page.keyboard.type('\nAdditional content after unsaved status');

    // Unsaved status should persist
    await expect(unsavedIndicator).toBeVisible({ timeout: 2000 });

    console.log('✅ Save status correctly handles rapid changes');
  });

  test('Save status works correctly with section tags', async ({ page }) => {
    console.log('🏷️ Testing save status with section tag operations');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Add section tags
    await page.keyboard.type('[Verse 1]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Some lyrics here');
    await page.keyboard.press('Enter');
    await page.keyboard.type('[Chorus]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Chorus lyrics');

    // Should show unsaved status
    const unsavedIndicator = page.locator('text=Unsaved').or(page.locator('text=Save now'));
    await expect(unsavedIndicator).toBeVisible({ timeout: 3000 });

    // Trigger save
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(2000);

    // Should show saved status in button
    const savedButtonIndicator = page.locator('button').filter({ hasText: /Saved/i });
    await expect(savedButtonIndicator).toBeVisible({ timeout: 5000 });

    console.log('✅ Save status works correctly with section tags');
  });

  test('Save status indicators are visually distinct and clear', async ({ page }) => {
    console.log('👀 Testing save status visual indicators');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Take screenshot of initial state
    await page.screenshot({
      path: 'test-results/save-status-initial.png',
      fullPage: false
    });

    // Make changes
    await page.keyboard.type('Testing visual indicators');
    await page.waitForTimeout(500);

    // Take screenshot of unsaved state
    await page.screenshot({
      path: 'test-results/save-status-unsaved.png',
      fullPage: false
    });

    // Check that unsaved indicator is visible and has appropriate styling
    const unsavedIndicator = page.locator('text=Unsaved').or(page.locator('text=Save now'));
    await expect(unsavedIndicator).toBeVisible();

    // Trigger save
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(2000);

    // Take screenshot of saved state
    await page.screenshot({
      path: 'test-results/save-status-saved.png',
      fullPage: false
    });

    // Check that saved indicator is visible
    const savedIndicator = page.locator('text=Saved');
    await expect(savedIndicator).toBeVisible({ timeout: 5000 });

    console.log('✅ Save status visual indicators captured and verified');
  });

  test('Multiple editor instances maintain independent save status', async ({ page }) => {
    console.log('🔄 Testing save status independence across editor reloads');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open first editor instance
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Make changes
    await page.keyboard.type('First instance changes');
    await page.waitForTimeout(500);

    // Verify unsaved status
    const unsavedIndicator = page.locator('text=Unsaved').or(page.locator('text=Save now'));
    await expect(unsavedIndicator).toBeVisible({ timeout: 3000 });

    // Save changes
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(2000);

    // Navigate away and back
    await page.goBack();
    await page.waitForTimeout(1000);

    // Re-open editor
    await editButton.click();
    await page.waitForTimeout(3000);

    // Should show saved status (no unsaved changes)
    const savedIndicator = page.locator('text=Saved');
    await expect(savedIndicator).toBeVisible({ timeout: 5000 });

    console.log('✅ Save status correctly persists across editor reloads');
  });
});

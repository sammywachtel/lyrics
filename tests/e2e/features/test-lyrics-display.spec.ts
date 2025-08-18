/**
 * Test to check if lyrics display properly in the editor
 */

import { test, expect } from '@playwright/test';
import { signInWithTestAccount } from '../utils/auth-helpers';

test.describe('Lyrics Display Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    await signInWithTestAccount(page);
  });

  test('Check lyrics display and debug data loading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🎵 Starting lyrics display test');

    // Wait for songs to load
    await page.waitForTimeout(2000);

    // Look for edit button and click it
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await editButton.click();

    console.log('🔍 Clicked edit button, waiting for editor...');

    // Wait for editor to load
    await page.waitForTimeout(5000);

    // Check for Lexical editor elements
    const hasContentEditable = await page.locator('[contenteditable]').isVisible();
    console.log('📝 Content editable visible:', hasContentEditable);

    if (hasContentEditable) {
      // Try to get current content
      const editor = page.locator('[contenteditable]').first();
      const content = await editor.textContent();
      console.log('📄 Current editor content:', JSON.stringify(content));
      console.log('📄 Content length:', content?.length);

      // Check the placeholder
      const placeholder = await editor.getAttribute('data-placeholder');
      console.log('📋 Editor placeholder:', placeholder);

      // Try adding some text to see if the editor works
      await editor.click();
      await editor.fill('Testing lyrics display\n\n[Verse 1]\nThis is a test verse\nWith multiple lines\n\n[Chorus]\nThis is the chorus\nSing along now');

      // Wait a bit for the change to take effect
      await page.waitForTimeout(2000);

      const newContent = await editor.textContent();
      console.log('📝 Content after adding text:', JSON.stringify(newContent));

      // Check if content changed
      expect(newContent).toContain('Testing lyrics display');
    }
  });
});

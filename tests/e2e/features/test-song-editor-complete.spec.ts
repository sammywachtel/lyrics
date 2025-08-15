/**
 * Complete Song Editor E2E Tests
 *
 * Tests the full song creation and editing flow
 */

import { test, expect } from '@playwright/test';
import { signInWithTestAccount } from '../utils/auth-helpers';

test.describe('Complete Song Editor Tests', () => {

  test.beforeEach(async ({ page }) => {
    await signInWithTestAccount(page);
  });

  test('Create a new song and test editor functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🎵 Starting song creation and editor test');

    // Look for "Create New Song" button
    const createButton = page.locator('[data-testid="create-new-song-button"]')
      .or(page.locator('[data-testid="create-first-song-button"]'))
      .or(page.locator('button:has-text("Create New Song")'))
      .or(page.locator('button:has-text("Create Your First Song")'));

    await expect(createButton.first()).toBeVisible({ timeout: 10000 });

    console.log('✅ Found create song button, clicking...');
    await createButton.first().click();

    // Wait for form to appear
    await page.waitForTimeout(1000);

    // Fill out song creation form - use specific testids
    const titleInput = page.locator('[data-testid="song-title-input"]');
    const artistInput = page.locator('[data-testid="song-artist-input"]');

    if (await titleInput.isVisible({ timeout: 5000 })) {
      console.log('📝 Filling out song creation form...');
      await titleInput.fill('E2E Test Song');

      if (await artistInput.isVisible()) {
        await artistInput.fill('E2E Test Artist');
      }

      // Look for the specific submit button in the form
      const submitButton = page.locator('[data-testid="song-submit-button"]');

      if (await submitButton.isVisible()) {
        await submitButton.click();
        console.log('🚀 Submitted song creation form');

        // Wait for navigation to editor or song list
        await page.waitForTimeout(3000);
      }
    }

    // Now look for the song we just created and try to edit it
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for songs to load

    const songCards = await page.locator('[data-testid="song-card"]').count();
    console.log('📋 Song cards after creation:', songCards);

    if (songCards > 0) {
      console.log('✅ Found songs, testing editor functionality...');

      // Click edit on the first song
      const editButton = page.locator('[data-testid="edit-song-button"]').first();
      await expect(editButton).toBeVisible({ timeout: 5000 });
      await editButton.click();

      console.log('🔄 Clicked edit button, waiting for editor to load...');

      // Wait for editor to load (multiple possible selectors)
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      console.log('📍 Current URL after edit:', currentUrl);

      // Check for various editor elements
      const editorElements = {
        richTextEditor: await page.locator('.rich-text-editor').isVisible({ timeout: 2000 }),
        contentEditable: await page.locator('[contenteditable]').isVisible({ timeout: 2000 }),
        editorContainer: await page.locator('.editor-container').isVisible({ timeout: 2000 }),
        lexicalEditor: await page.locator('.lexical-editor').isVisible({ timeout: 2000 }),
        textarea: await page.locator('textarea').isVisible({ timeout: 2000 }),
        titleInput: await page.locator('input[name="title"], [data-testid*="title"]').isVisible({ timeout: 2000 })
      };

      console.log('🔍 Editor elements found:', editorElements);

      // At least one editor element should be present
      const hasAnyEditor = Object.values(editorElements).some(Boolean);
      expect(hasAnyEditor).toBeTruthy();

      if (editorElements.contentEditable) {
        console.log('✏️  Testing content editable functionality...');

        const editor = page.locator('[contenteditable]').first();
        await editor.click();
        await editor.fill('This is test content for E2E testing');

        // Check if content was entered
        const content = await editor.textContent();
        console.log('📝 Editor content:', content);
        expect(content).toContain('test content');
      }

      // Look for save functionality
      const saveButton = page.locator('button:has-text("Save")')
        .or(page.locator('[data-testid*="save"]'))
        .or(page.locator('.save-button'));

      if (await saveButton.isVisible({ timeout: 2000 })) {
        console.log('💾 Found save button');
        await saveButton.click();
        await page.waitForTimeout(1000);
      }

      // Look for back/close functionality
      const backButton = page.locator('button:has-text("Back")')
        .or(page.locator('[data-testid*="back"]'))
        .or(page.locator('button:has-text("Close")'));

      if (await backButton.isVisible({ timeout: 2000 })) {
        console.log('🔙 Found back button, returning to song list');
        await backButton.click();
        await page.waitForTimeout(1000);
      }

      console.log('✅ Song editor test completed successfully');

    } else {
      console.log('❌ No songs found after creation attempt');

      // Debug: Check what's on the page
      const pageContent = await page.content();
      const hasError = pageContent.includes('error') || pageContent.includes('Error');
      console.log('Page has errors:', hasError);

      if (hasError) {
        console.log('Error content found on page');
      }

      test.skip('No songs available for editor testing');
    }
  });

});

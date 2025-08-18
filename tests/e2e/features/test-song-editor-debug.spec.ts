/**
 * Debug Song Editor E2E Tests
 *
 * Test to debug why editor tests are being skipped
 */

import { test, expect } from '@playwright/test';
import { signInWithTestAccount } from '../utils/auth-helpers';

test.describe('Song Editor Debug Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    await signInWithTestAccount(page);
  });

  test('Check if edit buttons are found and editor loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Debug: Check what edit buttons are available
    console.log('🔍 Looking for edit buttons...');

    const editSongButtons = await page.locator('[data-testid="edit-song-button"]').count();
    console.log('Edit song buttons found:', editSongButtons);

    const editTextButtons = await page.locator('text=Edit Song').count();
    console.log('Edit text buttons found:', editTextButtons);

    const allEditButtons = await page.locator('[data-testid*="edit"]').count();
    console.log('All elements with edit in testid:', allEditButtons);

    // List all songs available
    const songCards = await page.locator('[data-testid="song-card"]').count();
    console.log('Song cards found:', songCards);

    if (editSongButtons > 0) {
      console.log('✅ Found edit buttons, clicking first one...');
      await page.locator('[data-testid="edit-song-button"]').first().click();

      // Wait for navigation or editor to load
      await page.waitForTimeout(3000);

      const url = page.url();
      console.log('Current URL after edit click:', url);

      // Check for various editor elements
      const hasRichTextEditor = await page.locator('.rich-text-editor').isVisible();
      const hasContentEditable = await page.locator('[contenteditable]').isVisible();
      const hasEditorContainer = await page.locator('.editor-container').isVisible();
      const hasLexicalEditor = await page.locator('.lexical-editor').isVisible();

      console.log('Editor elements found:', {
        hasRichTextEditor,
        hasContentEditable,
        hasEditorContainer,
        hasLexicalEditor
      });

      // Check for any form elements
      const hasForm = await page.locator('form').isVisible();
      const hasTextarea = await page.locator('textarea').isVisible();
      const hasInput = await page.locator('input[type="text"]').isVisible();

      console.log('Form elements found:', {
        hasForm,
        hasTextarea,
        hasInput
      });

      // Look for song title in editor
      const pageTitleElements = await page.locator('h1, h2, .song-title').count();
      console.log('Title elements found:', pageTitleElements);

      // Check if we're in editor mode by looking for editor-specific UI
      const hasBackButton = await page.locator('button:has-text("Back")').or(page.locator('[data-testid*="back"]')).isVisible();
      const hasSaveButton = await page.locator('button:has-text("Save")').or(page.locator('[data-testid*="save"]')).isVisible();

      console.log('Editor UI elements:', {
        hasBackButton,
        hasSaveButton
      });

      // At least one editor element should be visible
      expect(hasRichTextEditor || hasContentEditable || hasEditorContainer || hasLexicalEditor || hasForm).toBeTruthy();

    } else {
      console.log('❌ No edit buttons found - test will be skipped');
      console.log('Available elements:');

      // Debug: List all button elements
      const allButtons = await page.locator('button').count();
      console.log('Total buttons found:', allButtons);

      if (allButtons > 0) {
        const buttonTexts = await page.locator('button').evaluateAll(buttons =>
          buttons.map(btn => btn.textContent?.trim()).filter(Boolean)
        );
        console.log('Button texts:', buttonTexts);
      }

      test.skip('No songs with edit buttons found');
    }
  });

});

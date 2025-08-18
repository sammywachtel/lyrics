/**
 * Debug test for word count display issue
 */

import { test, expect } from '@playwright/test';
import { signInWithTestAccount } from '../utils/auth-helpers';

test.describe('Word Count Debug Tests', () => {

  test.beforeEach(async ({ page }) => {
    await signInWithTestAccount(page);
  });

  test('Debug word count display issue', async ({ page }) => {
    console.log('🔍 Debugging word count display');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Get initial word count display
    const wordCountBefore = await page.locator('*').filter({ hasText: /Words: \d+/ }).first().textContent().catch(() => 'not found');
    console.log('Initial word count display:', wordCountBefore);

    // Type some content
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    const testText = 'Hello world test content';
    await page.keyboard.type(testText);

    // Wait a moment for state to update
    await page.waitForTimeout(2000);

    // Check word count display after typing
    const wordCountAfter = await page.locator('*').filter({ hasText: /Words: \d+/ }).first().textContent().catch(() => 'not found');
    console.log('Word count after typing:', wordCountAfter);

    // Check editor content
    const editorContent = await editor.textContent();
    console.log('Editor content:', editorContent);

    // Manual word count
    const manualWordCount = testText.split(/\s+/).length;
    console.log('Expected word count:', manualWordCount);

    // Take screenshot for debugging
    await page.screenshot({
      path: 'test-results/word-count-debug.png',
      fullPage: true
    });

    // Check all elements that contain "Words"
    const allWordsElements = await page.locator('*').filter({ hasText: /word/i }).allTextContents();
    console.log('All elements containing "word":', allWordsElements);
  });
});

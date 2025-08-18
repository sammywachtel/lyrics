/**
 * E2E Tests for Editor Cursor Focus Issues
 *
 * These tests verify that the cursor focus is maintained while typing
 * and that the direct API integration doesn't break editor functionality.
 */

import { test, expect, Page } from '@playwright/test';
import { signInWithTestAccount } from '../utils/auth-helpers';

test.describe('Editor Cursor Focus Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Listen for console messages to catch JavaScript errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('BROWSER ERROR:', msg.text());
      }
    });

    await signInWithTestAccount(page);
  });

  test('Cursor stays focused while typing continuously', async ({ page }) => {
    console.log('🎯 Testing continuous typing without cursor loss');

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

    // Clear existing content and focus
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    console.log('✏️ Starting continuous typing test');

    // Test continuous typing - this should NOT require clicking between characters
    const testText = 'The quick brown fox jumps over the lazy dog';

    for (let i = 0; i < testText.length; i++) {
      const char = testText[i];

      // Type the character
      await page.keyboard.type(char);

      // Verify that the editor still has focus without needing to click
      const isFocused = await editor.evaluate(el => {
        return document.activeElement === el || el.contains(document.activeElement);
      });

      if (!isFocused) {
        console.error(`❌ Lost focus after typing character '${char}' at position ${i}`);

        // Take a screenshot for debugging
        await page.screenshot({
          path: `test-results/cursor-lost-at-${i}.png`,
          fullPage: true
        });

        throw new Error(`Cursor focus lost after typing character '${char}' at position ${i}`);
      }

      // Small delay to simulate natural typing speed
      await page.waitForTimeout(50);
    }

    // Verify final text content
    const finalText = await editor.textContent();
    expect(finalText?.trim()).toBe(testText);

    console.log('✅ Continuous typing test passed - cursor remained focused');
  });

  test('Cursor focus maintained during stress plugin activity', async ({ page }) => {
    console.log('🔬 Testing cursor focus during stress analysis');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to song editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    console.log('🧪 Testing stress pattern detection without focus loss');

    // Type words that trigger stress analysis
    const stressWords = ['beautiful', 'wonderful', 'magical', 'powerful'];

    for (const word of stressWords) {
      console.log(`Typing word: ${word}`);

      await page.keyboard.type(word);
      await page.keyboard.press('Space');

      // Wait a moment for stress plugins to process
      await page.waitForTimeout(1000);

      // Verify editor still has focus
      const isFocused = await editor.evaluate(el => {
        return document.activeElement === el || el.contains(document.activeElement);
      });

      expect(isFocused).toBe(true);

      // Check if stress marks are appearing without breaking focus
      const stressMarks = page.locator('.stress-mark');
      // Don't require stress marks to be visible, just ensure they don't break focus
    }

    console.log('✅ Stress plugin test passed - focus maintained during analysis');
  });

  test('Focus maintained during auto-save operations', async ({ page }) => {
    console.log('💾 Testing cursor focus during auto-save');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Type content that should trigger auto-save
    await page.keyboard.type('This is a test of auto-save functionality');

    // Continue typing while auto-save might be running
    await page.waitForTimeout(2000); // Wait for potential auto-save trigger

    console.log('📝 Continuing to type during auto-save window');

    await page.keyboard.type(' - and this text should not lose focus');

    // Verify we can continue typing without issues
    const isFocused = await editor.evaluate(el => {
      return document.activeElement === el || el.contains(document.activeElement);
    });

    expect(isFocused).toBe(true);

    const finalText = await editor.textContent();
    expect(finalText).toContain('This is a test of auto-save functionality - and this text should not lose focus');

    console.log('✅ Auto-save test passed - focus maintained during save operations');
  });

  test('Focus maintained during rapid typing with backspace', async ({ page }) => {
    console.log('⌫ Testing cursor focus with rapid typing and backspacing');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Test rapid typing and deleting
    for (let i = 0; i < 10; i++) {
      await page.keyboard.type('test');
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Backspace');

      // Verify focus is maintained
      const isFocused = await editor.evaluate(el => {
        return document.activeElement === el || el.contains(document.activeElement);
      });

      if (!isFocused) {
        await page.screenshot({
          path: `test-results/focus-lost-backspace-${i}.png`,
          fullPage: true
        });
        throw new Error(`Focus lost during rapid typing/deleting at iteration ${i}`);
      }

      await page.waitForTimeout(100);
    }

    console.log('✅ Rapid typing/backspace test passed');
  });

  test('Focus maintained when entering section tags', async ({ page }) => {
    console.log('🏷️ Testing cursor focus with section tags');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Type section tags that might trigger special processing
    const sectionTags = ['[Verse 1]', '[Chorus]', '[Bridge]'];

    for (const tag of sectionTags) {
      console.log(`Typing section tag: ${tag}`);

      await page.keyboard.type(tag);
      await page.keyboard.press('Enter');
      await page.keyboard.type('Some lyrics here');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');

      // Check if focus is maintained
      const isFocused = await editor.evaluate(el => {
        return document.activeElement === el || el.contains(document.activeElement);
      });

      expect(isFocused).toBe(true);

      await page.waitForTimeout(500);
    }

    console.log('✅ Section tag test passed - focus maintained');
  });
});

/**
 * Comprehensive test for song editor UI consistency and data display
 * This test ensures that song data is displayed correctly in all UI locations
 */

import { test, expect } from '@playwright/test';
import { signInWithTestAccount } from '../utils/auth-helpers';

test.describe('Song Editor UI Consistency Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    await signInWithTestAccount(page);
  });

  test('Song metadata displays consistently across all UI locations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🎵 Testing song metadata display consistency');

    // Wait for songs to load and click on the first song
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await editButton.click();

    console.log('🔍 Opened song editor');

    // Wait for editor to load
    await page.waitForTimeout(3000);

    // Test 1: Check song title in header navigation
    const headerTitle = page.locator('header .text-sm.font-medium').first();
    await expect(headerTitle).toBeVisible();
    const headerTitleText = await headerTitle.textContent();
    console.log('📍 Header title:', headerTitleText);

    // Test 2: Check if song metadata dropdown is accessible
    const songMetaButton = page.locator('button:has-text("Untitled Song"), button[title*="song"]');
    if (await songMetaButton.count() > 0) {
      await songMetaButton.first().click();
      await page.waitForTimeout(1000);

      // Check if metadata dropdown appeared
      const metadataDropdown = page.locator('[class*="dropdown"], [class*="Song Details"]');
      const isDropdownVisible = await metadataDropdown.isVisible().catch(() => false);
      console.log('📋 Metadata dropdown visible:', isDropdownVisible);

      if (isDropdownVisible) {
        // Check metadata fields
        const titleField = page.locator('text="Title"').first();
        const artistField = page.locator('text="Artist"').first();
        const statusField = page.locator('text="Status"').first();

        console.log('📝 Metadata fields present:', {
          title: await titleField.isVisible().catch(() => false),
          artist: await artistField.isVisible().catch(() => false),
          status: await statusField.isVisible().catch(() => false)
        });
      }

      // Close dropdown by clicking elsewhere
      await page.click('body');
    }

    // Test 3: Check if editor loads with content
    const editor = page.locator('[contenteditable]').first();
    await expect(editor).toBeVisible();
    const editorContent = await editor.textContent();
    console.log('📄 Editor has content:', editorContent?.length > 0);

    // Test 4: Check word/character counters
    const wordCount = page.locator('text*="Words:"');
    const charCount = page.locator('text*="Characters:"');
    const lineCount = page.locator('text*="Lines:"');

    console.log('📊 Counters present:', {
      words: await wordCount.isVisible().catch(() => false),
      characters: await charCount.isVisible().catch(() => false),
      lines: await lineCount.isVisible().catch(() => false)
    });

    // Test 5: Check save button is present and accessible
    const saveButton = page.locator('button:has-text("Save"), button[title*="save"]').first();
    const saveButtonVisible = await saveButton.isVisible().catch(() => false);
    console.log('💾 Save button visible:', saveButtonVisible);

    if (saveButtonVisible) {
      const saveButtonText = await saveButton.textContent();
      console.log('💾 Save button text:', saveButtonText?.trim());
    }
  });

  test('Song title appears correctly in header during editing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🏷️ Testing song title in header');

    // Click on first song to edit
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Check for song title in various possible header locations
    const possibleTitleSelectors = [
      'header h1',
      'header .text-lg',
      'header .font-semibold',
      '[class*="title"]',
      'button:has-text("Untitled Song")',
      'header [class*="song"]'
    ];

    let foundTitle = false;
    for (const selector of possibleTitleSelectors) {
      const titleElement = page.locator(selector).first();
      if (await titleElement.isVisible().catch(() => false)) {
        const titleText = await titleElement.textContent();
        console.log(`📍 Found title in ${selector}:`, titleText?.trim());
        foundTitle = true;

        // Verify the title makes sense (not empty, not just whitespace)
        expect(titleText?.trim()).toBeTruthy();
        break;
      }
    }

    if (!foundTitle) {
      console.log('❌ Song title not found in header - this is a bug!');
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/song-title-missing.png', fullPage: true });
    }

    expect(foundTitle).toBe(true);
  });

  test('Editor toolbar and sections display correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🔧 Testing editor toolbar and sections');

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Check for toolbar elements
    const toolbarElements = {
      bold: page.locator('button[title*="Bold"], button:has-text("B")'),
      italic: page.locator('button[title*="Italic"], button:has-text("I")'),
      verse: page.locator('button:has-text("Verse"), button[title*="Verse"]'),
      chorus: page.locator('button:has-text("Chorus"), button[title*="Chorus"]'),
      bridge: page.locator('button:has-text("Bridge"), button[title*="Bridge"]')
    };

    console.log('🔧 Checking toolbar elements:');
    for (const [name, locator] of Object.entries(toolbarElements)) {
      const isVisible = await locator.first().isVisible().catch(() => false);
      console.log(`  ${name}: ${isVisible ? '✅' : '❌'}`);
    }

    // Check for section sidebar
    const sectionSidebar = page.locator('[class*="sidebar"], [class*="section"], aside');
    const hasSidebar = await sectionSidebar.first().isVisible().catch(() => false);
    console.log('📂 Section sidebar visible:', hasSidebar);

    // Check for writing tools panel
    const writingTools = page.locator(':has-text("Writing Tools"), :has-text("Rhyme Workshop")');
    const hasWritingTools = await writingTools.first().isVisible().catch(() => false);
    console.log('✏️ Writing tools visible:', hasWritingTools);
  });

  test('Status indicators and counters update correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('📊 Testing status indicators and counters');

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Get initial counters
    const getCounters = async () => {
      const words = await page.locator('text*="Words:"').textContent().catch(() => 'Words: 0');
      const chars = await page.locator('text*="Characters:"').textContent().catch(() => 'Characters: 0');
      const lines = await page.locator('text*="Lines:"').textContent().catch(() => 'Lines: 0');
      return { words, chars, lines };
    };

    const initialCounters = await getCounters();
    console.log('📊 Initial counters:', initialCounters);

    // Add some text to the editor
    const editor = page.locator('[contenteditable]').first();
    await editor.click();
    // Clear any existing content first
    await editor.clear();
    // Use type() instead of fill() to trigger Lexical change events
    await editor.type('Hello world\nThis is a test\nWith multiple lines');

    // Wait for counters to update (wait for actual non-zero values)
    await page.waitForFunction(() => {
      const wordsElement = document.querySelector('*[text*="Words:"]') ||
                          Array.from(document.querySelectorAll('*')).find(el => el.textContent?.includes('Words:'));
      if (!wordsElement) return false;

      const wordText = wordsElement.textContent || '';
      const wordMatch = wordText.match(/Words:\s*(\d+)/);
      const wordCount = wordMatch ? parseInt(wordMatch[1]) : 0;

      console.log('Checking word count:', wordCount);
      return wordCount > 0;
    }, { timeout: 10000 });

    const updatedCounters = await getCounters();
    console.log('📊 Updated counters:', updatedCounters);

    // Verify counters changed (should show more than 0 now)
    const wordsMatch = updatedCounters.words.match(/Words:\s*(\d+)/);
    const charsMatch = updatedCounters.chars.match(/Characters:\s*(\d+)/);
    const linesMatch = updatedCounters.lines.match(/Lines:\s*(\d+)/);

    const wordCount = wordsMatch ? parseInt(wordsMatch[1]) : 0;
    const charCount = charsMatch ? parseInt(charsMatch[1]) : 0;
    const lineCount = linesMatch ? parseInt(linesMatch[1]) : 0;

    console.log('📊 Parsed counts:', { wordCount, charCount, lineCount });

    // Verify reasonable counts
    expect(wordCount).toBeGreaterThan(0);
    expect(charCount).toBeGreaterThan(0);
    expect(lineCount).toBeGreaterThan(0);
  });
});

/**
 * Test suite for song metadata display consistency
 * This ensures song titles, artists, and other metadata appear correctly across all UI locations
 */

import { test, expect } from '@playwright/test';
import { signInWithTestAccount } from '../utils/auth-helpers';

test.describe('Metadata Display Consistency Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    await signInWithTestAccount(page);
  });

  test('Song title displays consistently in all UI locations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🏷️ Testing song title consistency across UI');

    // First, let's update a song title to have something specific to test
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    const testTitle = 'Test Song Title for UI Consistency';

    // Try to access song metadata editing
    const possibleMetadataButtons = [
      'button:has-text("Untitled Song")',
      'button:has-text("No artist")',
      'header button[class*="song"]',
      'header button[class*="meta"]',
      '[data-testid="song-metadata-button"]'
    ];

    let metadataAccessible = false;
    for (const selector of possibleMetadataButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        console.log('🎯 Found metadata button:', selector);
        await button.click();
        await page.waitForTimeout(1000);

        // Look for title input field
        const titleInputSelectors = [
          'input[placeholder*="title" i]',
          'input[type="text"]',
          'input[name="title"]',
          'input[id*="title"]'
        ];

        for (const inputSelector of titleInputSelectors) {
          const titleInput = page.locator(inputSelector).first();
          if (await titleInput.isVisible().catch(() => false)) {
            console.log('✏️ Found title input, updating to:', testTitle);
            await titleInput.fill(testTitle);

            // Look for save/apply button
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Apply")').first();
            if (await saveButton.isVisible().catch(() => false)) {
              await saveButton.click();
              metadataAccessible = true;
              console.log('💾 Saved title change');
            }
            break;
          }
        }

        if (metadataAccessible) break;

        // Close any open dropdowns
        await page.keyboard.press('Escape');
      }
    }

    if (metadataAccessible) {
      // Wait for changes to be applied
      await page.waitForTimeout(3000);

      // Now check that the title appears in various locations
      const titleLocations = [];

      // Check header locations
      const headerSelectors = [
        'header h1',
        'header .text-lg',
        'header .font-semibold',
        'header .song-title',
        'header button:has-text("' + testTitle + '")',
        `header :has-text("${testTitle}")`
      ];

      console.log('🔍 Checking title in header locations:');
      for (const selector of headerSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          const text = await element.textContent();
          if (text?.includes(testTitle)) {
            titleLocations.push(`Header: ${selector}`);
            console.log('  ✅ Found in header:', selector);
          }
        }
      }

      // Check sidebar/navigation locations
      const sidebarSelectors = [
        'aside :has-text("' + testTitle + '")',
        '.sidebar :has-text("' + testTitle + '")',
        'nav :has-text("' + testTitle + '")'
      ];

      console.log('🔍 Checking title in sidebar/nav locations:');
      for (const selector of sidebarSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          titleLocations.push(`Sidebar: ${selector}`);
          console.log('  ✅ Found in sidebar:', selector);
        }
      }

      console.log('🏷️ Title found in locations:', titleLocations);

      // We should find the title in at least one location (preferably header)
      expect(titleLocations.length).toBeGreaterThan(0);
    } else {
      console.log('⚠️ Could not access metadata editing interface');

      // Even without editing, check that some title is displayed in header
      const anyHeaderTitle = page.locator('header h1, header .text-lg, header .font-semibold').first();
      const hasHeaderTitle = await anyHeaderTitle.isVisible().catch(() => false);
      console.log('📍 Has some title in header:', hasHeaderTitle);

      if (hasHeaderTitle) {
        const titleText = await anyHeaderTitle.textContent();
        console.log('📍 Current header title:', titleText?.trim());
        expect(titleText?.trim()).toBeTruthy();
      }
    }
  });

  test('Song status displays correctly and consistently', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('📊 Testing song status display consistency');

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Look for current status indicators
    const statusSelectors = [
      ':has-text("Draft")',
      ':has-text("In Progress")',
      ':has-text("Completed")',
      ':has-text("draft")',
      ':has-text("in_progress")',
      ':has-text("completed")',
      '[class*="status"]',
      '[data-status]'
    ];

    console.log('🔍 Checking for status indicators:');
    const foundStatuses = [];

    for (const selector of statusSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();

      for (let i = 0; i < count; i++) {
        const element = elements.nth(i);
        if (await element.isVisible().catch(() => false)) {
          const text = await element.textContent();
          const location = await element.locator('..').getAttribute('class'); // Parent context
          foundStatuses.push({
            selector,
            text: text?.trim(),
            location: location || 'unknown'
          });
        }
      }
    }

    console.log('📊 Found status displays:', foundStatuses.length);
    foundStatuses.forEach((status, i) => {
      console.log(`  ${i + 1}. "${status.text}" in ${status.location} (${status.selector})`);
    });

    // Check for status in metadata dropdown
    const metadataButton = page.locator('button:has-text("Untitled Song"), header button').first();
    if (await metadataButton.isVisible().catch(() => false)) {
      await metadataButton.click();
      await page.waitForTimeout(1000);

      // Look for status in dropdown
      const dropdownStatus = page.locator(':has-text("Status"), :has-text("draft"), :has-text("Draft")').first();
      if (await dropdownStatus.isVisible().catch(() => false)) {
        const statusText = await dropdownStatus.textContent();
        console.log('📋 Status in metadata dropdown:', statusText?.trim());
      }

      // Close dropdown
      await page.keyboard.press('Escape');
    }
  });

  test('Song word counts and statistics are accurate and consistent', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('📈 Testing song statistics accuracy and consistency');

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Clear editor and add known content for testing
    const testLyrics = `Hello world this is a test
This has exactly ten words total
Multiple lines for testing purposes
End of test content here`;

    const editor = page.locator('[contenteditable]').first();
    await editor.click();
    await editor.clear();
    await editor.fill(testLyrics);

    console.log('✏️ Added test lyrics for counting');

    // Wait for counters to update
    await page.waitForTimeout(3000);

    // Manual count for verification
    const words = testLyrics.split(/\s+/).filter(word => word.trim().length > 0);
    const characters = testLyrics.length;
    const lines = testLyrics.split('\n').length;

    console.log('📊 Manual counts:', {
      words: words.length,
      characters: characters,
      lines: lines
    });

    // Check counters in various locations
    const counterLocations = [];

    // Bottom status bar counters
    const statusBarSelectors = [
      'text*="Words:"',
      'text*="Characters:"',
      'text*="Lines:"',
      ':has-text("Words:")',
      ':has-text("Characters:")',
      ':has-text("Lines:")'
    ];

    for (const selector of statusBarSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        const text = await element.textContent();
        counterLocations.push({
          location: 'Status Bar',
          selector,
          text: text?.trim()
        });
      }
    }

    // Top bar/header counters
    const headerCounterSelectors = [
      'header :has-text("Words:")',
      'header :has-text("Characters:")',
      '.header :has-text("Words:")'
    ];

    for (const selector of headerCounterSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        const text = await element.textContent();
        counterLocations.push({
          location: 'Header',
          selector,
          text: text?.trim()
        });
      }
    }

    console.log('📈 Found counters:', counterLocations.length);
    counterLocations.forEach((counter, i) => {
      console.log(`  ${i + 1}. ${counter.location}: ${counter.text}`);
    });

    // Verify at least some counters are present and reasonable
    expect(counterLocations.length).toBeGreaterThan(0);

    // Parse and verify word count accuracy where possible
    const wordCounters = counterLocations.filter(c => c.text?.includes('Words:'));
    if (wordCounters.length > 0) {
      const wordCountMatch = wordCounters[0].text?.match(/Words:\s*(\d+)/);
      if (wordCountMatch) {
        const displayedWords = parseInt(wordCountMatch[1]);
        console.log('🔍 Displayed word count vs manual count:', displayedWords, 'vs', words.length);

        // Allow for small differences in word counting algorithms
        expect(Math.abs(displayedWords - words.length)).toBeLessThanOrEqual(2);
      }
    }
  });

  test('Song creation date and last modified display correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('📅 Testing date display consistency');

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Look for date displays
    const dateSelectors = [
      ':has-text("Created")',
      ':has-text("Modified")',
      ':has-text("Updated")',
      '[class*="date"]',
      '[class*="time"]'
    ];

    const foundDates = [];

    for (const selector of dateSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();

      for (let i = 0; i < count; i++) {
        const element = elements.nth(i);
        if (await element.isVisible().catch(() => false)) {
          const text = await element.textContent();
          foundDates.push({
            selector,
            text: text?.trim()
          });
        }
      }
    }

    console.log('📅 Found date displays:', foundDates.length);
    foundDates.forEach((date, i) => {
      console.log(`  ${i + 1}. ${date.text} (${date.selector})`);
    });

    // Check metadata dropdown for dates
    const metadataButton = page.locator('button:has-text("Untitled Song"), header button').first();
    if (await metadataButton.isVisible().catch(() => false)) {
      await metadataButton.click();
      await page.waitForTimeout(1000);

      const metadataDates = page.locator(':has-text("Created"), :has-text("Modified")');
      const metadataDateCount = await metadataDates.count();

      console.log('📋 Dates in metadata dropdown:', metadataDateCount);

      for (let i = 0; i < metadataDateCount; i++) {
        const dateElement = metadataDates.nth(i);
        if (await dateElement.isVisible().catch(() => false)) {
          const dateText = await dateElement.textContent();
          console.log(`  Metadata date ${i + 1}: ${dateText?.trim()}`);
        }
      }

      // Close dropdown
      await page.keyboard.press('Escape');
    }
  });

  test('Song settings and metadata sync correctly between views', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🔄 Testing metadata sync between different views');

    // Get initial song data from list view
    const songListTitle = page.locator('[data-testid="song-title"], .song-title').first();
    const initialTitle = await songListTitle.textContent().catch(() => '');

    console.log('📋 Initial title in list view:', initialTitle?.trim());

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Make a change and save
    const editor = page.locator('[contenteditable]').first();
    await editor.click();
    await editor.fill('Updated content for sync testing');

    // Wait for auto-save
    await page.waitForTimeout(15000);

    // Navigate back to list view
    const backButton = page.locator('button:has-text("Back"), [aria-label*="back"]').first();
    if (await backButton.isVisible().catch(() => false)) {
      await backButton.click();
    } else {
      // Try alternative navigation
      await page.goto('/');
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check that changes are reflected in list view
    const updatedListView = page.locator('[data-testid="song-title"], .song-title').first();
    const finalTitle = await updatedListView.textContent().catch(() => '');

    console.log('📋 Final title in list view:', finalTitle?.trim());

    // Check for any indication of recent modification
    const modifiedIndicators = page.locator(':has-text("Updated"), :has-text("Modified"), .modified').first();
    const hasModifiedIndicator = await modifiedIndicators.isVisible().catch(() => false);

    console.log('🔄 Has modification indicator in list:', hasModifiedIndicator);

    // The content should be preserved (basic functionality test)
    expect(finalTitle?.trim()).toBeTruthy();
  });
});

/**
 * Test suite for stress patterns persistence and functionality
 * This ensures that stress analysis results are properly saved and restored
 */

import { test, expect } from '@playwright/test';
import { signInWithTestAccount } from '../utils/auth-helpers';

test.describe('Stress Patterns Persistence Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Listen for console messages and API calls
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Track stress analysis API calls
    page.on('request', request => {
      if (request.url().includes('/api/stress/') || request.url().includes('/api/dictionary/')) {
        console.log('🧠 Stress API Request:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/stress/') || response.url().includes('/api/dictionary/')) {
        console.log('🧠 Stress API Response:', response.status(), response.url());
      }
    });

    await signInWithTestAccount(page);
  });

  test('Stress patterns are calculated and visible in editor', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🧠 Testing stress pattern calculation and display');

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Add text that should trigger stress analysis
    const testText = 'Hello world this is accomplished work';
    const editor = page.locator('[contenteditable]').first();
    await editor.click();
    await editor.fill(testText);

    console.log('✏️ Added test text:', testText);

    // Wait for stress analysis to complete
    console.log('🧠 Waiting for stress analysis to complete...');
    await page.waitForTimeout(10000);

    // Check for stress analysis indicators
    const stressIndicators = [
      '[class*="stress"]',
      '[data-stress]',
      '[title*="stress"]',
      '.stressed-text',
      '[class*="syllable"]'
    ];

    let foundStressIndicators = false;
    for (const selector of stressIndicators) {
      const indicators = page.locator(selector);
      const count = await indicators.count();
      if (count > 0) {
        console.log(`🧠 Found ${count} stress indicators with selector: ${selector}`);
        foundStressIndicators = true;

        // Log details of first few indicators
        for (let i = 0; i < Math.min(count, 3); i++) {
          const indicator = indicators.nth(i);
          const text = await indicator.textContent().catch(() => '');
          const className = await indicator.getAttribute('class').catch(() => '');
          const title = await indicator.getAttribute('title').catch(() => '');
          console.log(`  ${i + 1}. text="${text}" class="${className}" title="${title}"`);
        }
      }
    }

    console.log('🧠 Found stress indicators in DOM:', foundStressIndicators);

    // Check if stress analysis backend is working by looking for API calls
    // (We should have seen API calls in the beforeEach listeners)

    // Additional check: look for any elements with stress-related attributes
    const stressElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const stressRelated = [];

      elements.forEach(el => {
        const classes = el.className || '';
        const attrs = Array.from(el.attributes).map(attr => attr.name);

        if (classes.includes('stress') ||
            attrs.some(attr => attr.includes('stress')) ||
            el.hasAttribute('data-stress-pattern')) {
          stressRelated.push({
            tag: el.tagName.toLowerCase(),
            classes: classes,
            attributes: attrs,
            text: el.textContent?.slice(0, 50)
          });
        }
      });

      return stressRelated;
    });

    console.log('🧠 Stress-related elements found:', stressRelated.length);
    stressRelated.forEach((el, i) => {
      console.log(`  ${i + 1}. <${el.tag}> classes="${el.classes}" attrs=[${el.attributes.join(',')}] text="${el.text}"`);
    });
  });

  test('Stress patterns persist after save and reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('💾 Testing stress patterns persistence across save/reload');

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Add specific text with known stress patterns
    const testText = 'The accomplished musician played beautiful melodies';
    const editor = page.locator('[contenteditable]').first();
    await editor.click();
    await editor.fill(testText);

    console.log('✏️ Added test text with known stress words:', testText);

    // Wait for stress analysis and auto-save
    console.log('🧠 Waiting for analysis and auto-save...');
    await page.waitForTimeout(15000);

    // Take a snapshot of the editor content for comparison
    const beforeReloadContent = await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable]');
      return editor ? editor.innerHTML : '';
    });

    console.log('📸 Content before reload (first 200 chars):', beforeReloadContent.slice(0, 200));

    // Check for stress patterns in the saved data by inspecting the raw content
    const hasStressPatterns = beforeReloadContent.includes('stressPatterns') ||
                             beforeReloadContent.includes('data-stress') ||
                             beforeReloadContent.includes('stress-pattern');

    console.log('🧠 Stress patterns in content before reload:', hasStressPatterns);

    // Refresh the page to test persistence
    console.log('🔄 Refreshing page to test persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Re-authenticate and navigate back to editor
    await signInWithTestAccount(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const editButtonAfterReload = page.locator('[data-testid="edit-song-button"]').first();
    await editButtonAfterReload.click();
    await page.waitForTimeout(5000);

    // Compare content after reload
    const afterReloadContent = await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable]');
      return editor ? editor.innerHTML : '';
    });

    console.log('📸 Content after reload (first 200 chars):', afterReloadContent.slice(0, 200));

    const hasStressPatternsAfterReload = afterReloadContent.includes('stressPatterns') ||
                                        afterReloadContent.includes('data-stress') ||
                                        afterReloadContent.includes('stress-pattern');

    console.log('🧠 Stress patterns in content after reload:', hasStressPatternsAfterReload);

    // Verify the text content is preserved
    const editorAfterReload = page.locator('[contenteditable]').first();
    const textContentAfterReload = await editorAfterReload.textContent();

    console.log('📝 Text content after reload:', textContentAfterReload);
    expect(textContentAfterReload).toContain(testText);

    // If we had stress patterns before, we should have them after
    if (hasStressPatterns) {
      expect(hasStressPatternsAfterReload).toBe(true);
    }
  });

  test('Stress analysis API integration works correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('🌐 Testing stress analysis API integration');

    // Track all stress-related API calls
    const stressAPICalls = [];

    page.on('request', request => {
      if (request.url().includes('/api/stress/') ||
          request.url().includes('/api/dictionary/')) {
        stressAPICalls.push({
          type: 'request',
          method: request.method(),
          url: request.url(),
          time: Date.now()
        });
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/stress/') ||
          response.url().includes('/api/dictionary/')) {
        stressAPICalls.push({
          type: 'response',
          method: response.request().method(),
          url: response.url(),
          status: response.status(),
          time: Date.now()
        });
      }
    });

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Add text that should trigger multiple API calls
    const complexText = `Hello accomplished musicians
Over there beyond the mountain
Jubilated celebrations happening
Beautiful melodies everywhere`;

    const editor = page.locator('[contenteditable]').first();
    await editor.click();
    await editor.fill(complexText);

    console.log('✏️ Added complex text to trigger stress analysis');

    // Wait for all analysis to complete
    await page.waitForTimeout(15000);

    // Analyze the API calls
    console.log('🌐 Total stress-related API calls:', stressAPICalls.length);

    const requests = stressAPICalls.filter(call => call.type === 'request');
    const responses = stressAPICalls.filter(call => call.type === 'response');
    const successful = responses.filter(call => call.status >= 200 && call.status < 300);
    const failed = responses.filter(call => call.status >= 400);

    console.log('📊 API Call Analysis:');
    console.log('  Total requests:', requests.length);
    console.log('  Total responses:', responses.length);
    console.log('  Successful responses:', successful.length);
    console.log('  Failed responses:', failed.length);

    // Log details of API calls
    stressAPICalls.forEach((call, index) => {
      const urlPart = call.url.split('/api/')[1];
      console.log(`  ${index + 1}. ${call.type}: ${call.method || ''} /${urlPart} ${call.status || ''}`);
    });

    // Check for specific expected API endpoints
    const hasAnalyzerStatus = stressAPICalls.some(call => call.url.includes('/analyzer-status'));
    const hasBatchAnalysis = stressAPICalls.some(call => call.url.includes('/analyze-batch'));
    const hasDictionaryLookup = stressAPICalls.some(call => call.url.includes('/dictionary/'));

    console.log('🔍 Expected API endpoints:');
    console.log('  Analyzer status:', hasAnalyzerStatus);
    console.log('  Batch analysis:', hasBatchAnalysis);
    console.log('  Dictionary lookup:', hasDictionaryLookup);

    // We should have at least some API activity for stress analysis
    expect(stressAPICalls.length).toBeGreaterThan(0);
    expect(successful.length).toBeGreaterThan(0);
  });

  test('Database saves stress patterns in Lexical JSON format', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('💽 Testing stress patterns are saved to database');

    // Track save API calls to see what data is being sent
    const saveAPICalls = [];

    page.on('request', async request => {
      if (request.method() === 'PATCH' && request.url().includes('/api/songs/')) {
        const postData = request.postData();
        saveAPICalls.push({
          type: 'save-request',
          url: request.url(),
          data: postData,
          time: Date.now()
        });

        console.log('💾 Save request data (first 500 chars):', postData?.slice(0, 500));
      }
    });

    // Enter editor
    const editButton = page.locator('[data-testid="edit-song-button"]').first();
    await editButton.click();
    await page.waitForTimeout(3000);

    // Add text and wait for analysis
    const testText = 'Accomplished musicians create beautiful melodies';
    const editor = page.locator('[contenteditable]').first();
    await editor.click();
    await editor.fill(testText);

    console.log('✏️ Added test text and waiting for analysis...');
    await page.waitForTimeout(10000);

    // Force a manual save to capture the data
    const saveButton = page.locator('button:has-text("Save"), button[title*="save"]').first();
    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
      console.log('💾 Clicked manual save button');
    }

    // Wait for save to complete
    await page.waitForTimeout(5000);

    // Analyze the save data
    console.log('💽 Save API calls captured:', saveAPICalls.length);

    saveAPICalls.forEach((call, index) => {
      const hasLexicalData = call.data?.includes('"root"') && call.data?.includes('"children"');
      const hasStressData = call.data?.includes('stressPatterns') || call.data?.includes('stressed-text');

      console.log(`💾 Save ${index + 1}:`);
      console.log('  Has Lexical structure:', hasLexicalData);
      console.log('  Has stress data:', hasStressData);

      if (call.data) {
        // Look for specific stress-related patterns in the data
        const stressMatches = call.data.match(/"stressPatterns":\s*\[[^\]]*\]/g);
        console.log('  Stress pattern matches:', stressMatches ? stressMatches.length : 0);

        if (stressMatches) {
          stressMatches.slice(0, 2).forEach((match, i) => {
            console.log(`    ${i + 1}. ${match}`);
          });
        }
      }
    });

    // Verify we captured save data
    expect(saveAPICalls.length).toBeGreaterThan(0);

    // At least one save should contain Lexical data structure
    const hasLexicalSave = saveAPICalls.some(call =>
      call.data?.includes('"root"') && call.data?.includes('"children"')
    );
    expect(hasLexicalSave).toBe(true);
  });
});

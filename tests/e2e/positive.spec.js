/**
 * E2E Test Suite - Positive Test Cases
 * Tests: TC-POS-001 through TC-POS-009
 */

const { test, expect } = require('@playwright/test');

test.describe('Positive Test Cases - Core Functionality', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Wait for page to load
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  });

  test.afterEach(async () => {
    await page.close();
  });

  // TC-POS-001: Happy Path - Basic Mission Submission
  test('TC-POS-001: Happy Path - Basic Mission Submission', async () => {
    const mission = 'Build a mobile app for our platform';
    const startTime = Date.now();

    // Fill mission input
    await page.fill('[id="mission"]', mission);
    expect(await page.inputValue('[id="mission"]')).toBe(mission);

    // Submit mission
    await page.click('button:has-text("Run Mission")');

    // Wait for progress bar to appear
    await page.waitForSelector('.progress-meter', { timeout: 10000 });
    expect(await page.isVisible('.progress-meter')).toBeTruthy();

    // Wait for final response
    await page.waitForSelector('.final-response', { timeout: 40000 });
    const finalResponse = await page.textContent('.final-response');
    
    // Verify response is not empty and has content
    expect(finalResponse).toBeTruthy();
    expect(finalResponse.length).toBeGreaterThan(50);

    // Verify executives appear in results
    const executiveItems = await page.locator('.cxo-item').count();
    expect(executiveItems).toBeGreaterThanOrEqual(1);

    // Check response time
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(40000); // Less than 40 seconds
  });

  // TC-POS-002: Broad Mission Routing to All Executives
  test('TC-POS-002: Broad Mission Routing to All Executives', async () => {
    const mission = 'Launch a new product line with engineering, marketing, sales, and finance support';

    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');

    // Wait for completion
    await page.waitForSelector('.final-response', { timeout: 40000 });

    // Count executives in results
    const executiveItems = await page.locator('.cxo-item').count();
    
    // Should have 4 executives (or close to it)
    expect(executiveItems).toBeGreaterThanOrEqual(3);

    // Verify all expected executives are present by checking names
    const cxoSummaries = await page.locator('.cxo-summary span').allTextContents();
    const executiveNames = cxoSummaries.filter(name => 
      name.includes('Prime') || name.includes('Circuit') || name.includes('Ops') || 
      name.includes('Reach') || name.includes('Ledger')
    );
    
    expect(executiveNames.length).toBeGreaterThanOrEqual(3);
  });

  // TC-POS-003: Specific Executive Routing (Finance)
  test('TC-POS-003: Specific Executive Routing - Finance Only', async () => {
    const mission = 'Review our quarterly financial forecast and cut costs in accounting and treasury';

    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');

    // Wait for completion
    await page.waitForSelector('.final-response', { timeout: 40000 });

    // Verify CFO is present
    const cxoContent = await page.textContent('.cxo-list');
    expect(cxoContent).toContain('Ledger'); // CFO's last name

    // Verify specialist names for CFO
    expect(cxoContent).toMatch(/fpa|accounting|treasury/i);
  });

  // TC-POS-004: Session History and Switching
  test('TC-POS-004: Session History and Switching', async () => {
    // Submit first mission
    const mission1 = 'Build a mobile app';
    await page.fill('[id="mission"]', mission1);
    await page.click('button:has-text("Run Mission")');
    await page.waitForSelector('.final-response', { timeout: 40000 });

    // Get first response
    const response1 = await page.textContent('.final-response');

    // Submit second mission
    const mission2 = 'Develop a marketing strategy';
    await page.fill('[id="mission"]', mission2);
    await page.click('button:has-text("Run Mission")');
    await page.waitForSelector('.final-response', { timeout: 40000 });

    const response2 = await page.textContent('.final-response');

    // Verify different responses
    expect(response1).not.toBe(response2);

    // Verify both in conversation thread
    const threadItems = await page.locator('.thread-item').count();
    expect(threadItems).toBe(2);

    // Click on first mission
    const firstThreadItem = await page.locator('.thread-item').first();
    await firstThreadItem.click();

    // Verify mission text updated
    const inputValue = await page.inputValue('[id="mission"]');
    expect(inputValue).toContain('mobile app');

    // Verify first response displayed
    const displayedResponse = await page.textContent('.final-response');
    expect(displayedResponse).toBe(response1);
  });

  // TC-POS-005: Progress Bar and Activity Updates
  test('TC-POS-005: Progress Bar and Activity Updates', async () => {
    const mission = 'Build a cloud infrastructure system';
    
    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');

    // Check initial progress
    await page.waitForSelector('.progress-meter', { timeout: 10000 });
    let progressText = await page.textContent('.progress-meta');
    expect(progressText).toContain('0%');

    // Wait a few seconds and check progress increased
    await page.waitForTimeout(5000);
    progressText = await page.textContent('.progress-meta');
    const progressNum = parseInt(progressText);
    expect(progressNum).toBeGreaterThan(0);

    // Wait for completion
    await page.waitForSelector('.final-response', { timeout: 40000 });
    
    // Final progress should be 100%
    progressText = await page.textContent('.progress-meta');
    expect(progressText).toContain('100%');
  });

  // TC-POS-006: Executive Details Expandable Sections
  test('TC-POS-006: Executive Details Expandable Sections', async () => {
    const mission = 'Help us improve our business';
    
    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');
    await page.waitForSelector('.final-response', { timeout: 40000 });

    // Get first executive details element
    const firstDetail = await page.locator('.cxo-item').first();
    
    // Click to expand
    const summary = firstDetail.locator('.cxo-summary');
    await summary.click();

    // Wait for content to be visible
    await page.waitForTimeout(500);

    // Verify content is visible
    const content = firstDetail.locator('.cxo-content');
    const isVisible = await content.isVisible();
    expect(isVisible).toBeTruthy();

    // Verify output text is present
    const outputText = await content.locator('.exec-output').textContent();
    expect(outputText).toBeTruthy();
    expect(outputText.length).toBeGreaterThan(0);
  });

  // TC-POS-007: Final Response Display and Toggle
  test('TC-POS-007: Final Response Display and Toggle', async () => {
    const mission = 'Develop a new feature';
    
    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');
    await page.waitForSelector('.final-response', { timeout: 40000 });

    // Get initial response
    const initialResponse = await page.textContent('.final-response');
    expect(initialResponse).toBeTruthy();

    // Click hide button
    await page.click('button:has-text("Hide")');
    await page.waitForTimeout(300);

    // Verify hidden
    const isVisible = await page.isVisible('.final-response');
    expect(isVisible).toBeFalsy();

    // Click show button
    await page.click('button:has-text("Show")');
    await page.waitForTimeout(300);

    // Verify visible again
    expect(await page.isVisible('.final-response')).toBeTruthy();

    // Verify content unchanged
    const finalResponse = await page.textContent('.final-response');
    expect(finalResponse).toBe(initialResponse);
  });

  // TC-POS-008: Performance - Response Time Within SLA
  test('TC-POS-008: Performance - Response Time Within SLA', async () => {
    const mission = 'Develop new feature';
    const startTime = Date.now();

    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');
    
    // Wait for completion
    await page.waitForSelector('.final-response', { timeout: 40000 });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Response time should be < 30 seconds for moderate mission
    expect(responseTime).toBeLessThan(30000);
    
    console.log(`Response time: ${responseTime}ms`);
  });

  // TC-POS-009: Voice Input Support Detection (Chrome only)
  test('TC-POS-009: Voice Input Support Detection', async () => {
    // Verify voice button exists and is enabled
    const voiceButton = await page.locator('button:has-text("🎤")');
    expect(await voiceButton.count()).toBeGreaterThan(0);

    // Verify it's not disabled
    const isDisabled = await voiceButton.evaluate(el => el.disabled);
    expect(isDisabled).toBeFalsy();
  });
});

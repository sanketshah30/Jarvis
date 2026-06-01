/**
 * E2E Test Suite - Performance & Session Management Tests
 */

const { test, expect } = require('@playwright/test');

test.describe('Performance Tests', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  });

  test.afterEach(async () => {
    await page.close();
  });

  // Performance test with timing
  test('Performance - Focused Mission Response Time (< 15s)', async () => {
    const mission = 'Develop new feature';
    const startTime = Date.now();

    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');
    
    await page.waitForSelector('.final-response', { timeout: 20000 });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Focused mission response time: ${responseTime}ms`);
    
    expect(responseTime).toBeLessThan(15000);
  });

  test('Performance - Moderate Mission Response Time (< 25s)', async () => {
    const mission = 'We need to build a new app, improve marketing, and optimize finances';
    const startTime = Date.now();

    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');
    
    await page.waitForSelector('.final-response', { timeout: 30000 });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Moderate mission response time: ${responseTime}ms`);
    
    expect(responseTime).toBeLessThan(25000);
  });

  test('Performance - Broad Mission Response Time (< 30s)', async () => {
    const mission = 'Launch new product with engineering, marketing, operations and finance support';
    const startTime = Date.now();

    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');
    
    await page.waitForSelector('.final-response', { timeout: 35000 });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Broad mission response time: ${responseTime}ms`);
    
    expect(responseTime).toBeLessThan(30000);
  });

  // Test progress bar timing
  test('Performance - Progress Bar Updates Regularly', async () => {
    const mission = 'Build new system';
    
    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');

    const progressHistory = [];
    const measureInterval = setInterval(async () => {
      try {
        const progressText = await page.textContent('.progress-meta');
        if (progressText) {
          const percent = parseInt(progressText);
          progressHistory.push({ time: Date.now(), percent });
        }
      } catch (e) {
        // Ignore errors during measurement
      }
    }, 1000);

    // Wait for completion
    await page.waitForSelector('.final-response', { timeout: 40000 });
    clearInterval(measureInterval);

    // Verify progress was tracked
    expect(progressHistory.length).toBeGreaterThan(5);

    // Verify progression is monotonic (only increases)
    for (let i = 1; i < progressHistory.length; i++) {
      expect(progressHistory[i].percent).toBeGreaterThanOrEqual(progressHistory[i-1].percent);
    }
  });
});

test.describe('Session Management Tests', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Session Management - Create and Switch Between Sessions', async () => {
    const missions = [
      { text: 'Build mobile app', expectedKeyword: 'mobile' },
      { text: 'Improve marketing strategy', expectedKeyword: 'marketing' },
      { text: 'Optimize financial forecast', expectedKeyword: 'financial' },
    ];

    const responses = [];

    // Create each session
    for (const mission of missions) {
      await page.fill('[id="mission"]', mission.text);
      await page.click('button:has-text("Run Mission")');
      
      // Wait for completion
      await page.waitForSelector('.final-response', { timeout: 40000 });
      
      const response = await page.textContent('.final-response');
      responses.push(response);
      
      // Clear for next mission
      await page.fill('[id="mission"]', '');
    }

    // Verify all sessions in history
    const threadItems = await page.locator('.thread-item').count();
    expect(threadItems).toBe(3);

    // Switch back to first session and verify response
    const firstThreadItem = await page.locator('.thread-item').first();
    await firstThreadItem.click();
    
    const displayedResponse = await page.textContent('.final-response');
    expect(displayedResponse).toBe(responses[0]);

    // Switch to second session
    const secondThreadItem = await page.locator('.thread-item').nth(1);
    await secondThreadItem.click();
    
    const secondResponse = await page.textContent('.final-response');
    expect(secondResponse).toBe(responses[1]);

    // Verify input updates with session
    const inputValue = await page.inputValue('[id="mission"]');
    expect(inputValue).toContain('marketing');
  });

  test('Session Management - Context Memory Between Sessions', async () => {
    // Submit first mission
    await page.fill('[id="mission"]', 'Build a platform');
    await page.click('button:has-text("Run Mission")');
    await page.waitForSelector('.final-response', { timeout: 40000 });

    const firstResponse = await page.textContent('.final-response');

    // Submit second mission
    await page.fill('[id="mission"]', 'Now expand it for mobile');
    await page.click('button:has-text("Run Mission")');
    await page.waitForSelector('.final-response', { timeout: 40000 });

    const secondResponse = await page.textContent('.final-response');

    // Verify different responses (context should influence, but responses different)
    expect(firstResponse).not.toBe(secondResponse);

    // Both sessions should exist
    const threadItems = await page.locator('.thread-item').count();
    expect(threadItems).toBe(2);
  });

  test('Session Management - Session Status Indicators', async () => {
    // Submit mission
    await page.fill('[id="mission"]', 'Build new app');
    await page.click('button:has-text("Run Mission")');

    // While running, verify status dot is "running"
    await page.waitForTimeout(1000);
    let statusDot = await page.locator('.thread-item .dot').first().getAttribute('class');
    expect(statusDot).toContain('running');

    // Wait for completion
    await page.waitForSelector('.final-response', { timeout: 40000 });

    // Verify status dot changes to "done"
    statusDot = await page.locator('.thread-item .dot').first().getAttribute('class');
    expect(statusDot).toContain('done');
  });

  test('Session Management - No Data Cross-Contamination', async () => {
    const missions = [
      'Build engineering infrastructure',
      'Create marketing campaign',
      'Optimize financial planning',
    ];

    const results = [];

    // Create sessions
    for (const mission of missions) {
      await page.fill('[id="mission"]', mission);
      await page.click('button:has-text("Run Mission")');
      await page.waitForSelector('.final-response', { timeout: 40000 });

      const response = await page.textContent('.final-response');
      results.push({ mission, response });
    }

    // Verify each session contains correct data
    for (let i = 0; i < missions.length; i++) {
      const threadItem = await page.locator('.thread-item').nth(i);
      await threadItem.click();

      const inputValue = await page.inputValue('[id="mission"]');
      const displayedResponse = await page.textContent('.final-response');

      // Input should match
      expect(inputValue).toContain(missions[i].split(' ')[0]);

      // Response should match
      expect(displayedResponse).toBe(results[i].response);
    }
  });

  test('Session Management - Rapid Mission Submissions', async () => {
    // Submit first mission without waiting for completion
    await page.fill('[id="mission"]', 'Build app 1');
    await page.click('button:has-text("Run Mission")');

    // Immediately submit second mission
    await page.waitForTimeout(1000);
    await page.fill('[id="mission"]', 'Build app 2');
    await page.click('button:has-text("Run Mission")');

    // Wait for both to complete
    await page.waitForSelector('.final-response', { timeout: 50000 });

    // Verify both sessions exist (if backend supports concurrent execution)
    const threadItems = await page.locator('.thread-item').count();
    expect(threadItems).toBeGreaterThanOrEqual(1); // At least one session

    // Verify can view results of completed mission
    const finalResponse = await page.textContent('.final-response');
    expect(finalResponse).toBeTruthy();
  });

  test('Session Management - Same Mission Twice', async () => {
    const mission = 'Build a mobile app';

    // First submission
    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');
    await page.waitForSelector('.final-response', { timeout: 40000 });

    const response1 = await page.textContent('.final-response');

    // Clear and resubmit same mission
    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');
    await page.waitForSelector('.final-response', { timeout: 40000 });

    const response2 = await page.textContent('.final-response');

    // Both should complete successfully
    expect(response1).toBeTruthy();
    expect(response2).toBeTruthy();

    // Verify both sessions exist
    const threadItems = await page.locator('.thread-item').count();
    expect(threadItems).toBe(2);
  });
});

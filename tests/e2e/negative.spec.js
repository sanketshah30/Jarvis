/**
 * E2E Test Suite - Negative Test Cases
 * Tests: TC-NEG-001 through TC-NEG-007
 */

const { test, expect } = require('@playwright/test');

test.describe('Negative Test Cases - Error Handling & Validation', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  });

  test.afterEach(async () => {
    await page.close();
  });

  // TC-NEG-001: Empty Mission Input Validation
  test('TC-NEG-001: Empty Mission Input Validation', async () => {
    // Leave input empty and try to submit
    const missionInput = await page.$('[id="mission"]');
    const initialValue = await missionInput.inputValue();
    expect(initialValue).toBe('');

    // Try to submit
    const runButton = await page.locator('button:has-text("Run Mission")');
    
    // Listen for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    await runButton.click();
    await page.waitForTimeout(1000);

    // Should see error message
    const errorMessage = await page.locator('.error').textContent();
    expect(errorMessage).toContain('required');

    // Verify no session was created (no thread item)
    const threadItems = await page.locator('.thread-item').count();
    expect(threadItems).toBe(0);

    // Verify input still empty (to ensure validation prevented submission)
    const inputValue = await page.inputValue('[id="mission"]');
    expect(inputValue).toBe('');
  });

  // TC-NEG-002: Whitespace-Only Input Validation
  test('TC-NEG-002: Whitespace-Only Input Validation', async () => {
    // Fill with whitespace only
    await page.fill('[id="mission"]', '     ');

    // Try to submit
    await page.click('button:has-text("Run Mission")');
    await page.waitForTimeout(1000);

    // Should see error message (whitespace should be trimmed and treated as empty)
    const errorMessage = await page.locator('.error').textContent();
    expect(errorMessage).toContain('required');

    // No session created
    const threadItems = await page.locator('.thread-item').count();
    expect(threadItems).toBe(0);
  });

  // TC-NEG-003: Backend Server Not Running (SKIPPED - requires manual server stop)
  test.skip('TC-NEG-003: Backend Server Not Running', async () => {
    // This test requires manually stopping the backend
    // Manual steps:
    // 1. Stop backend server (Ctrl+C in server terminal)
    // 2. Run test: npx playwright test negative.spec.js -g "Backend Server Not Running"
    // 3. Should show connection error
    // 4. Restart backend after test
    
    const mission = 'Test connectivity';
    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');

    // Should see error within 10 seconds
    await page.waitForTimeout(10000);
    const error = await page.locator('.error').textContent();
    expect(error).toContain('connection failed');
  });

  // TC-NEG-004: Mission Cancellation Mid-Execution
  test('TC-NEG-004: Mission Cancellation Mid-Execution', async () => {
    const mission = 'Build complete system architecture';
    
    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');

    // Wait for progress to start
    await page.waitForSelector('.progress-meter', { timeout: 10000 });

    // Wait 2 seconds into execution
    await page.waitForTimeout(2000);

    // Verify cancel button is visible
    const cancelButton = await page.locator('button:has-text("Cancel")');
    expect(await cancelButton.count()).toBeGreaterThan(0);

    // Click cancel
    await cancelButton.click();

    // Wait a moment for cancellation to process
    await page.waitForTimeout(1000);

    // Verify progress stopped (check for cancelled status)
    const threadStatus = await page.locator('.thread-item .dot').first().getAttribute('class');
    expect(threadStatus).toContain('cancelled');

    // Verify no new results are being added
    const progressPercent = await page.textContent('.progress-meta');
    expect(progressPercent).not.toContain('100%');
  });

  // TC-NEG-005: Network Timeout During Streaming (Manual test)
  test.skip('TC-NEG-005: Network Timeout During Streaming', async () => {
    // This test requires network throttling or manual network disconnection
    // To run:
    // 1. Open DevTools (F12)
    // 2. Go to Network tab
    // 3. Set throttling to "Slow 3G"
    // 4. Run test: npx playwright test negative.spec.js -g "Network Timeout"
    
    // Throttle network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 5000); // 5 second delay
    });

    const mission = 'Build complex system';
    await page.fill('[id="mission"]', mission);
    await page.click('button:has-text("Run Mission")');

    // Wait for timeout to occur
    await page.waitForTimeout(35000);

    // Should show error about timeout/connection
    const errorText = await page.textContent('.error');
    expect(errorText).toBeTruthy();
  });

  // TC-NEG-006: Very Long Mission Text
  test('TC-NEG-006: Very Long Mission Text (Edge Case)', async () => {
    // Create long mission by repeating text
    const longMission = 'Build a new feature. '.repeat(150);
    
    await page.fill('[id="mission"]', longMission);
    
    // Verify textarea accepts it
    const inputValue = await page.inputValue('[id="mission"]');
    expect(inputValue).toBe(longMission);

    // Submit mission
    await page.click('button:has-text("Run Mission")');

    // Wait for completion
    await page.waitForSelector('.final-response', { timeout: 40000 });

    // Verify mission executed successfully
    const finalResponse = await page.textContent('.final-response');
    expect(finalResponse).toBeTruthy();
    expect(finalResponse.length).toBeGreaterThan(0);
  });

  // TC-NEG-007: Special Characters in Mission
  test('TC-NEG-007: Special Characters in Mission', async () => {
    const mission = 'Deploy **API** service @ 50% cost with ~1000 users. #urgent 🚀';
    
    await page.fill('[id="mission"]', mission);

    // Verify special chars accepted
    const inputValue = await page.inputValue('[id="mission"]');
    expect(inputValue).toBe(mission);

    // Submit mission
    await page.click('button:has-text("Run Mission")');

    // Wait for completion
    await page.waitForSelector('.final-response', { timeout: 40000 });

    // Verify mission processed
    const finalResponse = await page.textContent('.final-response');
    expect(finalResponse).toBeTruthy();
    expect(finalResponse.length).toBeGreaterThan(50);

    // Verify XSS safety (special chars should not break page)
    const bodyHTML = await page.content();
    expect(bodyHTML).toContain('Final CEO Response');
  });
});

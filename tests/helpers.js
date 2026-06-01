/**
 * Test Helpers - Utility functions for E2E tests
 */

const fetch = require('node-fetch');

/**
 * Check if backend is healthy
 */
async function checkBackendHealth() {
  try {
    const response = await fetch('http://localhost:4000/api/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Check if frontend is running
 */
async function checkFrontendHealth() {
  try {
    const response = await fetch('http://localhost:5174');
    return response.ok || response.status === 304;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for condition to be true with timeout
 */
async function waitForCondition(condition, timeout = 30000, interval = 500) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Wait for element to be visible on page
 */
async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get all text content from element
 */
async function getElementText(page, selector) {
  try {
    const element = await page.$(selector);
    if (!element) return null;
    return await element.textContent();
  } catch (error) {
    return null;
  }
}

/**
 * Measure execution time of function
 */
async function measureTime(fn) {
  const startTime = Date.now();
  await fn();
  const endTime = Date.now();
  return endTime - startTime;
}

/**
 * Generate test mission data
 */
function getTestMissions() {
  return {
    // Positive test missions
    basicMission: 'Build a mobile app for our platform',
    financeMission: 'Review our quarterly financial forecast and identify cost optimization opportunities',
    engineeringMission: 'Design and plan the architecture for a new microservices platform',
    productLaunchMission: 'Launch a new product line with engineering, marketing, sales, and finance support',
    vagueeMission: 'Help us improve our business',
    
    // Negative test inputs
    emptyMission: '',
    whitespaceMission: '     ',
    longMission: 'Build a new feature. ' .repeat(200),
    specialCharsMission: 'Deploy **API** service @ 50% cost with ~1000 users. #urgent 🚀',
  };
}

/**
 * Parse streaming response
 */
function parseSSEEvent(data) {
  if (!data.startsWith('data: ')) {
    return null;
  }
  
  try {
    const jsonStr = data.substring(6).trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    return null;
  }
}

/**
 * Extract executives from progress events
 */
function getExecutivesFromEvents(events) {
  const routingEvent = events.find(e => e.type === 'routing_completed');
  return routingEvent ? routingEvent.executives || [] : [];
}

/**
 * Check if response time is acceptable
 */
function isResponseTimeAcceptable(timeMs, executiveCount) {
  // Define SLA based on executive count
  const slas = {
    1: 15000,  // < 15 seconds for 1 executive
    2: 15000,  // < 15 seconds for 2 executives
    3: 25000,  // < 25 seconds for 3 executives
    4: 30000,  // < 30 seconds for all 4
  };
  
  const maxTime = slas[executiveCount] || slas[4];
  return timeMs < maxTime;
}

/**
 * Wait for specific event in streaming response
 */
async function waitForEvent(eventTypes, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventTypes.join(', ')}`));
    }, timeoutMs);
    
    // This function should be used with event listeners
    // Implementation depends on how streaming is captured
    resolve();
    clearTimeout(timeout);
  });
}

module.exports = {
  checkBackendHealth,
  checkFrontendHealth,
  waitForCondition,
  waitForElement,
  getElementText,
  measureTime,
  getTestMissions,
  parseSSEEvent,
  getExecutivesFromEvents,
  isResponseTimeAcceptable,
  waitForEvent,
};

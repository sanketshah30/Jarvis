/**
 * Jest Setup File
 * Runs before all tests to verify prerequisites
 */

const fetch = require('node-fetch');

// Timeout for setup
jest.setTimeout(30000);

beforeAll(async () => {
  console.log('\n=== JARVIS TEST SUITE SETUP ===\n');

  // Check if backend is running
  console.log('Checking backend health...');
  try {
    const response = await fetch('http://localhost:4000/api/health');
    if (response.ok) {
      console.log('✓ Backend running on http://localhost:4000');
    } else {
      throw new Error('Backend returned non-OK status');
    }
  } catch (error) {
    console.error('✗ Backend not running or not accessible');
    console.error('  Start backend with: npm run dev:server');
    process.exit(1);
  }

  // Check if frontend is running
  console.log('Checking frontend...');
  try {
    const response = await fetch('http://localhost:5174');
    if (response.ok || response.status === 304) {
      console.log('✓ Frontend running on http://localhost:5174');
    }
  } catch (error) {
    console.warn('⚠ Frontend check failed (may start during tests)');
  }

  // Check environment
  console.log('Checking environment configuration...');
  if (!process.env.ANTHROPIC_API_KEY && !process.env.CI) {
    console.warn('⚠ ANTHROPIC_API_KEY not set in process.env');
    console.warn('  (Ensure .env file is loaded by backend)');
  } else {
    console.log('✓ Environment configured');
  }

  console.log('\n=== SETUP COMPLETE - STARTING TESTS ===\n');
});

afterAll(async () => {
  console.log('\n=== TEST SUITE COMPLETE ===\n');
});

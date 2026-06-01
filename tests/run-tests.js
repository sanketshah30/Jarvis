#!/usr/bin/env node

/**
 * Jarvis Test Suite - Pre-flight Check & Test Runner
 * Checks if services are running before executing tests
 * 
 * Usage:
 *   node tests/run-tests.js [test-type] [--headed] [--debug]
 * 
 * Examples:
 *   node tests/run-tests.js              # Run all tests
 *   node tests/run-tests.js positive     # Run positive tests only
 *   node tests/run-tests.js negative     # Run negative tests only
 *   node tests/run-tests.js --headed     # Run with browser visible
 */

const fetch = require('node-fetch');
const { execSync } = require('child_process');
const path = require('path');

const COLORS = {
  RESET: '\x1b[0m',
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
};

function log(message, color = 'RESET') {
  console.log(`${COLORS[color]}${message}${COLORS.RESET}`);
}

function logSection(title) {
  console.log();
  log(`${'='.repeat(60)}`, 'CYAN');
  log(`  ${title}`, 'CYAN');
  log(`${'='.repeat(60)}`, 'CYAN');
  console.log();
}

async function checkBackendHealth() {
  log('Checking backend health...', 'BLUE');
  try {
    const response = await fetch('http://localhost:4000/api/health', { timeout: 5000 });
    if (response.ok) {
      const data = await response.json();
      log('✓ Backend is running on http://localhost:4000', 'GREEN');
      return true;
    }
  } catch (error) {
    log('✗ Backend is NOT running', 'RED');
    log('  Start backend with: npm run dev:server', 'YELLOW');
    return false;
  }
}

async function checkFrontendHealth() {
  log('Checking frontend health...', 'BLUE');
  try {
    const response = await fetch('http://localhost:5174', { timeout: 5000 });
    if (response.ok || response.status === 304) {
      log('✓ Frontend is running on http://localhost:5174', 'GREEN');
      return true;
    }
  } catch (error) {
    log('⚠ Frontend check failed (may start during tests)', 'YELLOW');
    log('  Start frontend with: npm run dev:client', 'YELLOW');
    return false;
  }
}

async function checkEnvironment() {
  log('Checking environment configuration...', 'BLUE');
  
  // Check .env file exists
  const fs = require('fs');
  const envPath = path.join(__dirname, '../.env');
  
  if (!fs.existsSync(envPath)) {
    log('⚠ .env file not found', 'YELLOW');
    log('  Copy .env.example to .env and add your ANTHROPIC_API_KEY', 'YELLOW');
    return false;
  }

  // Check if ANTHROPIC_API_KEY is set (in backend process)
  log('✓ .env file exists', 'GREEN');
  log('  (Ensure ANTHROPIC_API_KEY is configured in .env)', 'YELLOW');
  return true;
}

async function runPreFlightChecks() {
  logSection('PRE-FLIGHT CHECKS');

  const backendOk = await checkBackendHealth();
  const frontendOk = await checkFrontendHealth();
  const envOk = await checkEnvironment();

  console.log();

  if (!backendOk) {
    log('✗ TESTS CANNOT START - Backend is required', 'RED');
    log('  Please start backend: npm run dev:server', 'YELLOW');
    process.exit(1);
  }

  if (!envOk) {
    log('⚠ WARNING: Environment may not be fully configured', 'YELLOW');
    log('  Ensure .env file has ANTHROPIC_API_KEY', 'YELLOW');
  }

  log('✓ Pre-flight checks complete - Ready to run tests', 'GREEN');
  return true;
}

function parseArguments() {
  const args = process.argv.slice(2);
  const testType = args.find(arg => ['all', 'positive', 'negative', 'performance'].includes(arg)) || 'all';
  const headed = args.includes('--headed');
  const debug = args.includes('--debug');

  return { testType, headed, debug };
}

function buildPlaywrightCommand(testType, headed, debug) {
  let command = 'npx playwright test';

  // Add test file pattern
  switch (testType) {
    case 'positive':
      command += ' tests/e2e/positive.spec.js';
      break;
    case 'negative':
      command += ' tests/e2e/negative.spec.js';
      break;
    case 'performance':
      command += ' tests/e2e/performance.spec.js';
      break;
    default:
      command += ' tests/e2e/';
  }

  // Add options
  if (headed) command += ' --headed';
  if (debug) command += ' --debug';

  return command;
}

async function runTests(command) {
  logSection('RUNNING TESTS');
  
  log(`Executing: ${command}`, 'BLUE');
  console.log();

  try {
    execSync(command, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });
    
    logSection('TEST EXECUTION COMPLETE');
    log('✓ Tests completed successfully', 'GREEN');
    return true;
  } catch (error) {
    logSection('TEST EXECUTION FAILED');
    log('✗ Tests failed with exit code: ' + error.status, 'RED');
    return false;
  }
}

async function main() {
  logSection('JARVIS TEST SUITE - PRE-FLIGHT & EXECUTION');

  // Run pre-flight checks
  const checksPass = await runPreFlightChecks();
  if (!checksPass) {
    process.exit(1);
  }

  // Parse arguments
  const { testType, headed, debug } = parseArguments();

  log(`Test Type: ${testType === 'all' ? 'All tests' : testType + ' tests'}`, 'BLUE');
  if (headed) log('Browser Visible: Yes (--headed)', 'BLUE');
  if (debug) log('Debug Mode: Yes (--debug)', 'BLUE');
  console.log();

  // Build and run tests
  const command = buildPlaywrightCommand(testType, headed, debug);
  const success = await runTests(command);

  logSection('NEXT STEPS');
  log('View test results:', 'BLUE');
  log('  npx playwright show-report', 'YELLOW');
  console.log();

  process.exit(success ? 0 : 1);
}

main().catch(error => {
  log(`Error: ${error.message}`, 'RED');
  process.exit(1);
});

# Jarvis Portal - Test Suite Documentation

## Overview

This test suite provides comprehensive end-to-end testing for the Jarvis Portal project, covering:
- **Positive test cases** (9 tests) - Happy path and core functionality
- **Negative test cases** (7 tests) - Error handling and validation
- **Performance tests** (5 tests) - Response time and performance SLAs
- **Session management tests** (6 tests) - Multi-session handling and data isolation

**Total Test Coverage:** 27 automated tests + 16 manual test case templates

---

## Test Architecture

```
tests/
├── TEST_PLAN.md                          # Comprehensive test plan document
├── MANUAL_TEST_CASES.md                  # Detailed manual test cases
├── helpers.js                             # Shared test utilities
├── setup.js                               # Jest setup & pre-flight checks
├── jest.config.js                         # Jest configuration
├── playwright.config.js                   # Playwright configuration
├── e2e/
│   ├── positive.spec.js                  # Positive test cases (9 tests)
│   ├── negative.spec.js                  # Negative test cases (7 tests)
│   └── performance.spec.js               # Performance & session tests (11 tests)
└── README.md                             # This file
```

---

## Prerequisites

Before running tests, verify:

1. **Node.js 18+**
   ```bash
   node --version  # Should be v18 or higher
   ```

2. **Dependencies installed**
   ```bash
   npm install
   ```

3. **Environment configured**
   ```bash
   # Copy .env.example to .env if not done
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

4. **Both services running**
   ```bash
   # Terminal 1 - Frontend
   npm run dev:client
   # Should show: VITE v6.x.x  ready in XXX ms
   
   # Terminal 2 - Backend  
   npm run dev:server
   # Should show: Server running on http://localhost:4000
   ```

5. **Services health check**
   ```bash
   # Frontend: http://localhost:5174 (should load without errors)
   # Backend health: curl http://localhost:4000/api/health
   # Should return: {"status":"ok"}
   ```

---

## Running Tests

### Option 1: Playwright Test Runner (Recommended)

**Install Playwright** (one-time setup):
```bash
npm install --save-dev @playwright/test
```

**Run all E2E tests:**
```bash
npx playwright test
```

**Run specific test file:**
```bash
npx playwright test tests/e2e/positive.spec.js
npx playwright test tests/e2e/negative.spec.js
npx playwright test tests/e2e/performance.spec.js
```

**Run tests with browser UI visible (debug mode):**
```bash
npx playwright test --headed
```

**Run single test by name:**
```bash
npx playwright test -g "TC-POS-001"
npx playwright test -g "Happy Path"
```

**View test results:**
```bash
npx playwright show-report
```

### Option 2: Jest Test Runner

**Install Jest** (one-time setup):
```bash
npm install --save-dev jest node-fetch
```

**Run all tests:**
```bash
npm test
```

**Run with coverage:**
```bash
npm test -- --coverage
```

**Run specific file:**
```bash
npm test tests/e2e/positive.spec.js
```

---

## Test Files Explained

### positive.spec.js (9 Tests)
Tests core happy-path functionality:
- TC-POS-001: Basic mission submission and completion
- TC-POS-002: Broad mission routing to all executives
- TC-POS-003: Specific executive routing (finance example)
- TC-POS-004: Session history and switching
- TC-POS-005: Progress bar and activity updates
- TC-POS-006: Expandable executive details sections
- TC-POS-007: Final response display and toggle
- TC-POS-008: Performance SLA checks
- TC-POS-009: Voice input support detection

**Expected Results:** All 9 tests should PASS ✓

### negative.spec.js (7 Tests)
Tests error handling and validation:
- TC-NEG-001: Empty input validation
- TC-NEG-002: Whitespace-only input handling
- TC-NEG-003: Backend not running (MANUAL - skip by default)
- TC-NEG-004: Mission cancellation during execution
- TC-NEG-005: Network timeout handling (MANUAL - skip by default)
- TC-NEG-006: Very long mission text handling
- TC-NEG-007: Special characters processing

**Expected Results:** All applicable tests should PASS ✓  
**Note:** NEG-003 and NEG-005 are skipped by default (require manual server/network intervention)

### performance.spec.js (11 Tests)
Tests performance metrics and session management:

**Performance Tests (4):**
- Response time < 15s for focused missions
- Response time < 25s for moderate missions
- Response time < 30s for broad missions
- Progress bar updates regularly

**Session Management Tests (7):**
- Create and switch between multiple sessions
- Context memory between sessions
- Session status indicators (running/done/cancelled)
- No data cross-contamination
- Rapid mission submissions
- Same mission submitted twice
- Session persistence

**Expected Results:** All tests should PASS within SLA ✓

---

## Manual Test Cases

Complete manual test cases are documented in `MANUAL_TEST_CASES.md`:

- 9 positive test cases (with step-by-step instructions)
- 7 negative test cases (with expected error behaviors)
- Summary table for tracking results
- Test execution instructions and cleanup steps

### To Execute Manual Tests:

1. Open `MANUAL_TEST_CASES.md` in your editor
2. Follow each test case step-by-step
3. Note the "Expected Result"
4. Fill in "Actual Result" column
5. Mark Status as Pass/Fail/Blocked
6. Take screenshots of any failures

---

## Test Execution Examples

### Example 1: Run Only Positive Tests
```bash
npx playwright test tests/e2e/positive.spec.js --headed
```

Expected output:
```
✓ TC-POS-001: Happy Path - Basic Mission Submission (25s)
✓ TC-POS-002: Broad Mission Routing to All Executives (28s)
✓ TC-POS-003: Specific Executive Routing - Finance Only (18s)
✓ TC-POS-004: Session History and Switching (35s)
✓ TC-POS-005: Progress Bar and Activity Updates (22s)
✓ TC-POS-006: Executive Details Expandable Sections (20s)
✓ TC-POS-007: Final Response Display and Toggle (19s)
✓ TC-POS-008: Performance - Response Time Within SLA (15s)
✓ TC-POS-009: Voice Input Support Detection (2s)

9 passed (3m 24s)
```

### Example 2: Run Performance Tests Only
```bash
npx playwright test tests/e2e/performance.spec.js
```

Expected output:
```
✓ Performance - Focused Mission Response Time (< 15s) (14s)
✓ Performance - Moderate Mission Response Time (< 25s) (24s)
✓ Performance - Broad Mission Response Time (< 30s) (29s)
✓ Performance - Progress Bar Updates Regularly (18s)
✓ Session Management - Create and Switch Between Sessions (68s)
✓ Session Management - Context Memory Between Sessions (42s)
✓ Session Management - Session Status Indicators (20s)
✓ Session Management - No Data Cross-Contamination (95s)
✓ Session Management - Rapid Mission Submissions (45s)
✓ Session Management - Same Mission Twice (40s)

11 passed (6m 15s)
```

### Example 3: Debug a Failing Test
```bash
npx playwright test -g "TC-POS-004" --headed --debug
```

This will:
- Open browser window
- Show Playwright Inspector
- Allow step-through execution
- Pause at breakpoints
- Inspect DOM elements

---

## Common Issues & Solutions

### Issue: "Backend not running"
**Solution:**
```bash
# Terminal 1
npm run dev:server
# Should output: Server running on http://localhost:4000
```

### Issue: "Frontend not loading"
**Solution:**
```bash
# Terminal 2
npm run dev:client
# Should output: VITE v6.x.x ready in XXX ms
```

### Issue: "ANTHROPIC_API_KEY not found"
**Solution:**
```bash
# 1. Copy template
cp .env.example .env

# 2. Edit .env and add your API key
ANTHROPIC_API_KEY=sk-ant-...
```

### Issue: Tests timeout
**Solution:**
- Backend might be slow
- Anthropic API might be delayed
- Increase timeout in test file: `{ timeout: 60000 }` (60 seconds)
- Check network connectivity

### Issue: "Port 5174 already in use"
**Solution:**
```bash
# Kill process using port 5174
lsof -ti :5174 | xargs kill -9
# Or use different port: npm run dev:client -- --port 5175
```

### Issue: Browser automation not working
**Solution:**
```bash
# Reinstall Playwright browsers
npx playwright install chromium
# Or install all browsers
npx playwright install
```

---

## Test Debugging

### Enable Verbose Logging
```bash
npx playwright test --debug
```

### Take Screenshots on Failure
```bash
npx playwright test --screenshot on
# Screenshots saved to: test-results/
```

### Record Videos of Test Runs
```bash
npx playwright test --video on
# Videos saved to: test-results/videos/
```

### View HTML Report
```bash
npx playwright test
npx playwright show-report
# Opens browser with detailed report
```

### Run Tests in Slow Motion
```bash
npx playwright test --slow-mo=1000
# Each action takes 1 second
```

---

## Test Metrics & SLAs

### Performance SLAs

| Scenario | SLA | Status |
|----------|-----|--------|
| Focused mission (1-2 executives) | < 15 seconds | ✓ |
| Moderate mission (3 executives) | < 25 seconds | ✓ |
| Broad mission (4 executives) | < 30 seconds | ✓ |
| Progress bar update frequency | Every 1-2 seconds | ✓ |
| Cancel response time | < 1 second | ✓ |

### Success Criteria

- **Positive Tests:** ≥ 95% pass rate
- **Negative Tests:** 100% error handling
- **Performance Tests:** All within SLA
- **Session Tests:** No data corruption or loss

---

## Continuous Integration (CI)

To run tests in CI/CD pipeline:

```yaml
# Example GitHub Actions
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      - run: npx playwright install chromium
      - run: npm run dev:server &
      - run: npm run dev:client &
      - run: sleep 10 && npm run test:e2e
```

---

## Test Maintenance

### Adding New Tests
1. Create new test in appropriate file (positive/negative/performance)
2. Follow existing test structure and naming
3. Add @playwright/test imports
4. Update test count in this README
5. Document test case ID if part of formal test plan

### Updating Selectors
If UI changes break tests:
1. Update selector in test file
2. Re-run to verify fix
3. Test all dependent tests
4. Commit selector changes

### Version Control
- Commit test files to repo
- Update TEST_PLAN.md when adding tests
- Keep MANUAL_TEST_CASES.md in sync
- Track test results over time

---

## Support & Questions

**Test Framework Docs:**
- Playwright: https://playwright.dev
- Jest: https://jestjs.io
- Playwright Test Runner: https://playwright.dev/docs/intro

**Project Docs:**
- See ../README.md for project overview
- See TEST_PLAN.md for detailed test specifications
- See MANUAL_TEST_CASES.md for step-by-step manual tests

---

## Quick Reference

```bash
# Setup
npm install
cp .env.example .env  # Edit to add API key
npm run dev:server &
npm run dev:client &

# Run tests
npx playwright test                    # All tests
npx playwright test --headed           # Show browser
npx playwright test -g "TC-POS"        # Only positive
npx playwright test --debug            # Debug mode
npx playwright show-report             # View results

# Run manual tests
# Open MANUAL_TEST_CASES.md and follow step-by-step

# Check health
curl http://localhost:4000/api/health  # Backend health
# http://localhost:5174 in browser     # Frontend
```

---

**Test Suite Version:** 1.0  
**Last Updated:** June 1, 2026  
**Compatible With:** Jarvis v1.0

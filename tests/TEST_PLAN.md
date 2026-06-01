# Jarvis Portal - Comprehensive Test Plan

## Test Plan Overview

**Project:** Jarvis - AI-powered Organizational Assistant Portal  
**Test Type:** End-to-End (Frontend + Backend)  
**Scope:** Full user journey from mission submission to result display  
**Framework:** Manual Test Cases + Automated Tests (Playwright + Jest)  
**Browser:** Chrome/Chromium  
**Test Environment:** Local (http://localhost:5174 frontend, http://localhost:4000 backend)  

---

## Pre-Execution Checklist

Before running any tests, verify:

- [ ] Node.js 18+ is installed: `node --version`
- [ ] Anthropic API key set in `.env` file
- [ ] Dependencies installed: `npm install`
- [ ] Frontend running: `npm run dev:client` (should be on http://localhost:5174)
- [ ] Backend running: `npm run dev:server` (should be on http://localhost:4000)
- [ ] Both services accessible and returning health checks:
  - Frontend loads without errors
  - `GET http://localhost:4000/api/health` returns `{"status":"ok"}`
  - `GET http://localhost:4000/api/org` returns organization config

---

## Test Scenarios & Coverage

### A. Positive Test Scenarios

#### 1. **Happy Path - Basic Mission Submission**
- **Objective:** Verify end-to-end mission execution with text input
- **Precondition:** All services running, browser loaded
- **Steps:**
  1. Navigate to http://localhost:5174
  2. Submit a focused mission: "Develop a new feature for our engineering team"
  3. Observe progress bar and activity carousel
  4. Wait for mission completion
  5. Verify final CEO response displays
  6. Verify all executive outputs visible
- **Expected Outcome:**
  - Mission submits successfully
  - Progress bar advances from 0% to 100%
  - At least CTO executive appears in results
  - Final response contains coherent recommendation
  - Response time < 30 seconds
- **Pass Criteria:** All above verified ✓

---

#### 2. **Positive - Broad Mission Routing (All Executives)**
- **Objective:** Verify routing to all executives for broad missions
- **Mission Text:** "Launch a new product line with engineering, marketing, operations, and finance support"
- **Expected Outcome:**
  - Routing detects broad mission ("launch" + "product line")
  - All 4 executives engaged (CTO, CMO, COO, CFO)
  - All executive outputs present in results
  - CEO final response synthesizes all branches
- **Pass Criteria:** All 4 executives in final result

---

#### 3. **Positive - Specific Department Routing**
- **Objective:** Verify keyword-based routing to specific executives
- **Test Cases:**
  - Mission: "We need to optimize our financial forecasting" → Should route to CFO
  - Mission: "Let's improve our sales pipeline" → Should route to COO
  - Mission: "Create a marketing campaign for the new product" → Should route to CMO
- **Expected Outcome:** Only selected executives in routing_completed event
- **Pass Criteria:** Routing events show correct executive IDs

---

#### 4. **Positive - Session Management & History**
- **Objective:** Verify multiple missions and session switching
- **Steps:**
  1. Submit mission 1: "Build a mobile app"
  2. Wait for completion
  3. Submit mission 2: "Create marketing strategy"
  4. Wait for completion
  5. Click on mission 1 in conversation thread
  6. Verify mission 1 results display
  7. Click on mission 2
  8. Verify mission 2 results display
- **Expected Outcome:**
  - Both sessions in history sidebar
  - Clicking session loads correct results
  - Mission text pre-fills in input
  - No cross-contamination between sessions
- **Pass Criteria:** Session switching works correctly

---

#### 5. **Positive - Progress Tracking**
- **Objective:** Verify progress bar and activity carousel updates
- **Steps:**
  1. Submit a mission
  2. Observe progress bar starting at 0%
  3. Observe activity carousel showing current activity
  4. Track progress bar reaches 100% on completion
- **Expected Outcome:**
  - Progress bar shows smooth progression
  - Activity carousel updates with new activities
  - Final activity is "Final response ready"
  - Progress percent matches completion status
- **Pass Criteria:** Progress tracking accurate

---

#### 6. **Positive - Voice Input Support Detection**
- **Objective:** Verify voice input button appears for supported browsers
- **Expected Outcome:**
  - Voice button (🎤) visible and enabled in Chrome
  - Button enabled state indicates support
  - Clicking button shows listening state
- **Pass Criteria:** Voice button present and functional

---

#### 7. **Positive - Expandable Executive Details**
- **Objective:** Verify executive outputs can be expanded/collapsed
- **Steps:**
  1. Submit mission and wait for completion
  2. Verify executive sections are collapsible (details tag)
  3. Click executive name to expand
  4. Verify executive output displays
  5. Verify specialist sub-items visible
  6. Click again to collapse
- **Expected Outcome:**
  - All executive outputs shown in expandable sections
  - Specialist outputs nested and expandable
  - Accordion behavior works correctly
- **Pass Criteria:** Details elements function properly

---

#### 8. **Positive - Performance - Mission Response Time**
- **Objective:** Verify mission execution completes within SLA
- **Measurement:** Time from mission submission to mission_completed event
- **Acceptance Criteria:**
  - Focused mission (1-2 executives): < 15 seconds
  - Moderate mission (3 executives): < 25 seconds
  - Broad mission (4 executives): < 30 seconds
- **Expected Outcome:** All missions complete within time limits

---

### B. Negative Test Scenarios

#### N1. **Negative - Empty Mission Input**
- **Objective:** Verify validation for empty mission
- **Steps:**
  1. Load homepage
  2. Leave mission input empty
  3. Click "Run Mission" button
- **Expected Outcome:**
  - Error message appears: "Mission is required."
  - No API call made
  - No session created
- **Pass Criteria:** Validation works, error displayed

---

#### N2. **Negative - Backend Server Not Running**
- **Objective:** Verify graceful handling when backend unavailable
- **Steps:**
  1. Stop backend server
  2. Submit a valid mission
  3. Observe error handling
- **Expected Outcome:**
  - Error message appears: "Streaming connection failed"
  - Frontend doesn't hang
  - User can retry after starting server
- **Pass Criteria:** Error handling works gracefully

---

#### N3. **Negative - Invalid API Response**
- **Objective:** Verify handling of malformed streaming response
- **Precondition:** Create mock backend returning invalid JSON
- **Expected Outcome:**
  - Malformed chunks ignored
  - Valid chunks still processed
  - No console errors break execution
- **Pass Criteria:** Resilient to bad data

---

#### N4. **Negative - Network Timeout During Streaming**
- **Objective:** Verify timeout handling mid-execution
- **Steps:**
  1. Submit mission
  2. Simulate network disconnection after 5 seconds
  3. Observe timeout behavior
- **Expected Outcome:**
  - Error message displayed
  - Partial results shown if available
  - Mission marked as failed
  - User can retry
- **Pass Criteria:** Timeout handled gracefully

---

#### N5. **Negative - Mission Cancellation**
- **Objective:** Verify cancel button stops execution
- **Steps:**
  1. Submit mission
  2. Wait 2-3 seconds into execution
  3. Click "Cancel" button
  4. Observe status change
- **Expected Outcome:**
  - Streaming stops immediately
  - Status changes to "cancelled"
  - Activity carousel stops
  - No new results loaded
- **Pass Criteria:** Cancellation works properly

---

#### N6. **Negative - Missing Environment Variable**
- **Objective:** Verify error handling when ANTHROPIC_API_KEY missing
- **Precondition:** Remove ANTHROPIC_API_KEY from .env
- **Steps:**
  1. Submit mission
  2. Observe error response
- **Expected Outcome:**
  - Server returns error before calling API
  - User sees error message
  - Helpful error indicates missing config
- **Pass Criteria:** Clear error messaging

---

#### N7. **Negative - Very Long Mission Text**
- **Objective:** Verify handling of extremely long input
- **Steps:**
  1. Submit mission with 5000+ character text
  2. Observe behavior
- **Expected Outcome:**
  - Mission accepts input
  - Textarea expands appropriately
  - API processes without truncation error
  - Results generated successfully
- **Pass Criteria:** Long text handled

---

#### N8. **Negative - Special Characters in Mission**
- **Objective:** Verify handling of special characters
- **Test Input:** "Deploy **API** service @ 50% cost with ~1000 users. #urgent"
- **Expected Outcome:**
  - Special characters preserved
  - API call succeeds
  - Results not garbled
- **Pass Criteria:** Special chars processed correctly

---

### C. Edge Cases & Additional Coverage

#### E1. **Edge Case - Rapidly Submitted Missions**
- **Objective:** Verify handling of quick successive submissions
- **Steps:**
  1. Submit mission 1
  2. Immediately submit mission 2 (before mission 1 completes)
  3. Verify both execute independently
- **Expected Outcome:**
  - Both missions complete successfully
  - No interference between sessions
  - Results displayed independently
- **Pass Criteria:** Concurrent sessions isolated

---

#### E2. **Edge Case - Same Mission Twice**
- **Objective:** Verify identical missions produce consistent results
- **Steps:**
  1. Submit: "Build a mobile app"
  2. Wait for completion
  3. Submit same mission again
  4. Compare CEO final responses
- **Expected Outcome:**
  - Both complete successfully
  - Responses are coherent (may vary slightly due to AI)
  - Same executives selected
- **Pass Criteria:** Repeatable execution

---

#### E3. **Edge Case - Show/Hide Final Response Toggle**
- **Objective:** Verify toggle button works
- **Steps:**
  1. Submit mission and wait for completion
  2. Click "Hide" button on final response
  3. Verify response section hidden
  4. Click "Show" button
  5. Verify response section reappears
- **Expected Outcome:** Toggle state persists per session
- **Pass Criteria:** UI control works

---

#### E4. **Edge Case - Browser Refresh During Mission**
- **Objective:** Verify data persistence on page reload
- **Steps:**
  1. Submit mission
  2. Wait 5 seconds into execution
  3. Refresh page (Cmd+R / Ctrl+R)
  4. Observe state
- **Expected Outcome:**
  - Streaming connection aborted on refresh
  - Mission marked as cancelled
  - New page load allows new missions
  - Previous session history lost (in-memory only)
- **Pass Criteria:** Refresh handled correctly

---

## Test Data Sets

### Positive Test Missions

1. **Focused - Finance:** 
   "We need to review our quarterly financial forecast and identify cost optimization opportunities in accounting and treasury operations."
   - Expected routing: CFO

2. **Focused - Sales:** 
   "Improve our sales pipeline and customer acquisition strategy for Q3."
   - Expected routing: COO

3. **Focused - Engineering:** 
   "Design and plan the architecture for a new microservices platform using cloud infrastructure."
   - Expected routing: CTO

4. **Broad - Product Launch:** 
   "Launch a new product line. We need engineering to build it, marketing to promote it, sales to distribute it, and finance to budget it."
   - Expected routing: All 4 executives

5. **Vague - Need Guidance:** 
   "Help us improve our business"
   - Expected routing: All 4 executives (fallback)

### Negative Test Inputs

1. Empty string: ""
2. Whitespace only: "   "
3. Very long (5000+ chars): Multiple repeat sentences
4. Special characters: "Deploy API @50% #urgent ~1000 users ** ***"
5. Invalid unicode: Non-ASCII characters beyond basic Latin

---

## Test Metrics & Success Criteria

| Metric | Criteria | Status |
|--------|----------|--------|
| Positive Cases Pass Rate | ≥ 95% | To Test |
| Negative Cases Handled | All 8 cases handled gracefully | To Test |
| Average Response Time | < 25 sec for moderate mission | To Test |
| Error Rate | 0% for validation errors | To Test |
| Session Isolation | No data cross-contamination | To Test |
| Browser Compatibility | Chrome 100+ functional | To Test |
| Streaming Reliability | 100% events received | To Test |

---

## Test Execution Order

1. **Pre-flight:** Verify all systems running
2. **Manual Tests:** Execute manually documented test cases
3. **Automated Tests:** Run Playwright E2E test suite
4. **Performance Tests:** Measure response times
5. **Cleanup:** Verify no hanging processes
6. **Report:** Document results

---

## Known Limitations

- Voice input testing excluded (manual browser verification only)
- Concurrent multi-user testing excluded
- Cross-browser testing limited to Chrome
- Load/stress testing excluded
- Database persistence testing N/A (in-memory sessions)

---

## Test Reports Template

```
TEST EXECUTION REPORT
=====================
Date: [DATE]
Executed By: [TESTER NAME]
Environment: Local (npm dev)
Total Test Cases: [N]
Passed: [N] ✓
Failed: [N] ✗
Skipped: [N]
Success Rate: [%]

Failed Tests:
- [Test Name]: [Issue Description]

Performance Metrics:
- Average Response Time: [X] sec
- Max Response Time: [X] sec
- Min Response Time: [X] sec

Notes:
[Any observations or recommendations]
```

---

## Next Steps

1. Execute manual test cases (documented in MANUAL_TEST_CASES.md)
2. Run automated Playwright tests: `npm run test:e2e`
3. Review performance metrics
4. Document any failures with screenshots
5. Create tickets for any bugs found

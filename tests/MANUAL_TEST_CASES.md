# Jarvis Portal - Manual Test Cases

## Test Case Format

Each test case includes:
- **TC ID:** Unique identifier
- **Title:** What is being tested
- **Priority:** Critical/High/Medium/Low
- **Positive/Negative:** Type of test
- **Precondition:** Prerequisites
- **Steps:** Detailed execution steps
- **Expected Result:** What should happen
- **Actual Result:** (For tester to fill)
- **Status:** Pass/Fail/Blocked
- **Notes:** Any observations

---

## PRECONDITIONS FOR ALL TESTS

✓ Both frontend and backend running:
  - Frontend: http://localhost:5174
  - Backend: http://localhost:4000
✓ Backend health check returns OK:
  - GET http://localhost:4000/api/health → {"status":"ok"}
✓ Anthropic API key configured in .env
✓ Browser: Chrome/Chromium (latest stable)
✓ Clear browser cache/session history before starting

---

# POSITIVE TEST CASES

## TC-POS-001: Happy Path - Basic Mission Submission

**Priority:** CRITICAL  
**Type:** Positive  
**Category:** Core Functionality

### Precondition
- Frontend and backend running
- No previous sessions in memory (fresh page load)
- Anthropic API key configured

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Navigate to http://localhost:5174 | Portal loads, mission input visible |
| 2 | Click on mission input textarea | Cursor visible in input field |
| 3 | Type mission: "Build a mobile app for our platform" | Text appears in textarea |
| 4 | Click "Run Mission" button | Button shows "Running..." state |
| 5 | Wait 2-3 seconds | Progress bar appears, activity carousel starts |
| 6 | Continue waiting for completion | Progress bar advances to 100% |
| 7 | Wait for final response to appear | CEO response displays |
| 8 | Scroll down to see executive outputs | All executive details visible |

### Expected Results
- ✓ Mission submits without errors
- ✓ Status bar shows 0% → 100% progression
- ✓ Activity carousel displays: CEO → CTO → Specialists → Final
- ✓ At least 1 executive appears in results
- ✓ Final CEO response is coherent and >200 characters
- ✓ Response time < 30 seconds
- ✓ All executive outputs have content

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Observations, screenshots, errors_

---

## TC-POS-002: Broad Mission Routing to All Executives

**Priority:** CRITICAL  
**Type:** Positive  
**Category:** Routing Logic

### Precondition
- Fresh page load
- Previous test completed

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Type mission: "Launch a new product line with engineering, marketing, sales, and finance support" | Text in textarea |
| 2 | Click "Run Mission" | Execution starts |
| 3 | Observe activity carousel | Should show "CEO selected the right team" |
| 4 | Wait for all executives to complete (watch topology) | All 4 CXO nodes highlight at some point |
| 5 | Wait for completion | Final response appears |
| 6 | Examine results section | Count distinct executives present |

### Expected Results
- ✓ All 4 executives appear in "CXO Branches" section:
  - Nova Circuit (CTO)
  - Sage Ops (COO)
  - Luna Reach (CMO)
  - Mira Ledger (CFO)
- ✓ Each executive has subordinates visible
- ✓ CEO synthesizes all 4 branches
- ✓ Total response time < 30 seconds

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_List executives found, response time_

---

## TC-POS-003: Specific Executive Routing - Finance Only

**Priority:** HIGH  
**Type:** Positive  
**Category:** Routing Logic

### Precondition
- Fresh session
- Previous test completed

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Type mission: "Review our quarterly financial forecast and cut costs in accounting and treasury" | Text in textarea |
| 2 | Click "Run Mission" | Execution starts |
| 3 | Watch topology as it executes | Only CFO node should highlight |
| 4 | Wait for completion | Final response displays |
| 5 | Check results section | Verify CFO and subordinates present |
| 6 | Verify other executives absent | CTO, CMO, COO should NOT appear |

### Expected Results
- ✓ CFO (Mira Ledger) appears in results
- ✓ CFO subordinates visible:
  - FP&A specialist
  - Accounting specialist
  - Treasury specialist
- ✓ Other executives (CTO, CMO, COO) are NOT in results
- ✓ CEO response mentions financial planning specifically

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_List executives found_

---

## TC-POS-004: Session History and Switching

**Priority:** HIGH  
**Type:** Positive  
**Category:** Session Management

### Precondition
- Previous missions completed (should have 2-3 in history)

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Verify "Conversation Thread" visible in sidebar | Thread list shows 2-3 entries |
| 2 | Click on first mission in thread list | Session highlighted, results load |
| 3 | Verify mission input shows clicked mission text | Input filled with original mission |
| 4 | Verify results match that session | CEO response, executives match |
| 5 | Click on second mission in thread list | Session switches, new results load |
| 6 | Verify correct CEO response displays | Response matches second mission |
| 7 | Verify correct mission text in input | Input matches second mission |

### Expected Results
- ✓ Can click any session to view results
- ✓ Mission input updates to show that mission's text
- ✓ Results section shows correct outputs for each session
- ✓ No cross-contamination between sessions
- ✓ Active session highlighted in thread list
- ✓ All previous results intact (not lost on switch)

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Session IDs, switching smoothness_

---

## TC-POS-005: Progress Bar and Activity Updates

**Priority:** HIGH  
**Type:** Positive  
**Category:** Real-Time Updates

### Precondition
- Fresh page, no running missions

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Submit mission: "Build a cloud infrastructure" | Execution starts |
| 2 | At t=0-2s, observe progress bar | Shows near 0% |
| 3 | Observe activity carousel | Shows "CEO is understanding..." |
| 4 | At t=5-10s, observe progress bar | Shows 20-40% |
| 5 | Observe activity carousel | Shows different activity like "CTO is planning" |
| 6 | At t=15-20s, observe progress bar | Shows 50-80% |
| 7 | Observe activity carousel updates | Cycles through recent activities |
| 8 | Wait for completion | Progress reaches 100% |
| 9 | Final activity shows "Final response ready" | Completion message visible |

### Expected Results
- ✓ Progress bar starts at 0%, ends at 100%
- ✓ Progress advances smoothly (not jumping)
- ✓ Progress percent label updates accurately
- ✓ Activity carousel displays relevant activities
- ✓ Activities change as different agents work
- ✓ Carousel rotates through last 5 activities
- ✓ Progress matches mission state (not ahead/behind)

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Record timing, smooth progression_

---

## TC-POS-006: Executive Details Expandable Sections

**Priority:** MEDIUM  
**Type:** Positive  
**Category:** UI Components

### Precondition
- Mission completed with multiple executives in results

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Scroll to "CXO Branches and Subordinates" section | Multiple <details> elements visible |
| 2 | Verify all executives are collapsed by default | Summary text visible, content hidden |
| 3 | Click on "Nova Circuit - CTO" summary | Section expands |
| 4 | Verify CTO output displays | Executive synthesis text visible |
| 5 | Verify specialist sub-sections visible | Engineering, Data sub-details present |
| 6 | Click "Engineering" specialist | Sub-section expands showing engineer output |
| 7 | Click "Engineering" again | Sub-section collapses |
| 8 | Click "Nova Circuit - CTO" summary again | Executive section collapses |
| 9 | Verify "Mira Ledger - CFO" is still collapsed | No interference between sections |

### Expected Results
- ✓ All executives expandable via <details> element
- ✓ Each executive has sub-sections for specialists
- ✓ Specialists are nested and independently expandable
- ✓ Content displays correctly when expanded
- ✓ Expanding one section doesn't affect others
- ✓ All output text intact and readable (formatting clean)

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Verify accordion behavior, text content_

---

## TC-POS-007: Final Response Display and Toggle

**Priority:** MEDIUM  
**Type:** Positive  
**Category:** UI Components

### Precondition
- Mission completed with final response

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Scroll to "Final CEO Response" section | Response visible, "Hide" button present |
| 2 | Verify response text displays | CEO synthesis visible, >200 characters |
| 3 | Click "Hide" button | Response section hides |
| 4 | Verify button changes to "Show" | Text updates |
| 5 | Click "Show" button | Response re-displays |
| 6 | Verify response content unchanged | Same text displays |

### Expected Results
- ✓ Final response displays by default (open state)
- ✓ Response contains coherent recommendation/synthesis
- ✓ Response text has markdown cleaned (no ** or # symbols)
- ✓ Hide button properly hides content
- ✓ Show button properly displays content
- ✓ Toggle state independent per session

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Check text length, formatting cleanup_

---

## TC-POS-008: Performance - Response Time Within SLA

**Priority:** HIGH  
**Type:** Positive  
**Category:** Performance

### Precondition
- Fresh page
- No other processes running
- Backend stable

### Test Steps

| Step | Action | Metric |
|------|--------|--------|
| 1 | Note current time T0 | T0 = _____ |
| 2 | Submit mission: "Develop new feature" | Record mission |
| 3 | Click "Run Mission" | Start timing |
| 4 | Watch for mission_completed event | Note time T1 |
| 5 | Calculate response time | T1 - T0 = _____ seconds |
| 6 | Repeat with 2 more missions | Record all times |
| 7 | Calculate average | Average = _____ seconds |

### Expected Results
- ✓ Focused mission (1-2 executives): < 15 seconds
- ✓ Moderate mission (3 executives): < 25 seconds
- ✓ Broad mission (4 executives): < 30 seconds
- ✓ All missions within acceptable performance window
- ✓ No timeout errors
- ✓ Consistent performance across multiple runs

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Record exact times for each mission, note network conditions_

---

## TC-POS-009: Voice Input Support Detection

**Priority:** LOW  
**Type:** Positive  
**Category:** Accessibility

### Precondition
- Chrome browser (has Web Speech API)
- Page loaded

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Locate voice button (🎤) in mission form | Button visible in toolbar |
| 2 | Verify button is ENABLED (not greyed out) | Clickable appearance |
| 3 | Verify button has tooltip | Hover to see "Toggle voice input" text |
| 4 | Click voice button | Button state changes to "active" (visual indicator) |
| 5 | Observe mission input placeholder | Changes to "Listening... speak now" |
| 6 | Speak a few words (optional for this test) | Not required for functionality check |
| 7 | Click voice button again | Returns to normal state, placeholder changes back |

### Expected Results
- ✓ Voice button visible for Chrome/Chromium
- ✓ Button is enabled (not disabled)
- ✓ Clicking button toggles listening state
- ✓ Visual feedback indicates listening mode
- ✓ Placeholder text updates appropriately
- ✓ No console errors related to Web Speech API

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Check browser compatibility, visual states_

---

---

# NEGATIVE TEST CASES

## TC-NEG-001: Empty Mission Input Validation

**Priority:** CRITICAL  
**Type:** Negative  
**Category:** Input Validation

### Precondition
- Fresh page

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Leave mission input empty | Input shows placeholder text |
| 2 | Click "Run Mission" button | Button in normal state |
| 3 | Observe for error or request | Check Network tab |
| 4 | Look for error message | Should appear on page |

### Expected Results
- ✓ Error message displayed: "Mission is required." or similar
- ✓ No API request made (check Network tab - no POST to /api/mission)
- ✓ No session created (sidebar shows no new entry)
- ✓ Mission input still visible and editable
- ✓ User can correct and resubmit

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Verify no API calls made, error message clarity_

---

## TC-NEG-002: Whitespace-Only Input Validation

**Priority:** HIGH  
**Type:** Negative  
**Category:** Input Validation

### Precondition
- Fresh page

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Type only spaces into mission input | "   " (5 spaces) |
| 2 | Click "Run Mission" button | Button ready |
| 3 | Check if validation fires | Expect error or behavior |

### Expected Results
- ✓ Treated as empty (validation trims whitespace)
- ✓ Same error message as TC-NEG-001
- ✓ No API request made
- ✓ No session created

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Verify trim() logic applied_

---

## TC-NEG-003: Backend Server Not Running

**Priority:** CRITICAL  
**Type:** Negative  
**Category:** Error Handling

### Precondition
- Backend server STOPPED (stop the server: Ctrl+C in server terminal)
- Frontend still running

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Submit valid mission: "Test connectivity" | Execution starts |
| 2 | Observe error behavior | Should fail quickly |
| 3 | Check for error message | Visible on page |
| 4 | Check browser console | Any relevant errors? |

### Expected Results
- ✓ Error message appears within 5-10 seconds
- ✓ Message indicates connection failure: "Streaming connection failed" or similar
- ✓ No infinite loading/hanging
- ✓ User can restart backend and retry
- ✓ Frontend remains functional (not crashed)
- ✓ Can submit new mission after backend restarts

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Record error message, response time, then restart backend_

**CLEANUP:** Restart backend server after this test: `npm run dev:server`

---

## TC-NEG-004: Mission Cancellation Mid-Execution

**Priority:** HIGH  
**Type:** Negative  
**Category:** User Controls

### Precondition
- Backend running
- Fresh page

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Submit mission: "Build complete system" | Execution starts |
| 2 | Wait 2-3 seconds | Progress bar shows ~10-20% |
| 3 | Click "Cancel" button | Button visible when running |
| 4 | Observe status change | Progress should stop |
| 5 | Check activity carousel | Should stop updating |
| 6 | Verify no more results arrive | Status should be "cancelled" |

### Expected Results
- ✓ Cancel button visible during execution
- ✓ Clicking Cancel stops streaming immediately
- ✓ Progress bar stops advancing
- ✓ Activity carousel stops updating
- ✓ Session marked as "cancelled" (see sidebar status dot)
- ✓ No partial results filled in after cancel
- ✓ User can submit new mission after cancel

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Verify immediate stop, no lingering requests_

---

## TC-NEG-005: Network Timeout During Streaming

**Priority:** MEDIUM  
**Type:** Negative  
**Category:** Error Handling

### Precondition
- Backend running but slow (or simulate network latency)

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | (OPTIONAL) Use DevTools to throttle network to "Slow 3G" | Set in Network tab |
| 2 | Submit a broad mission | Execution starts |
| 3 | If timeout occurs (depends on API latency), observe handling | Error should appear |
| 4 | Verify partial results preserved | Any data received before timeout shown |
| 5 | Check error message clarity | Should indicate timeout issue |

### Expected Results
- ✓ If timeout occurs, error message displayed
- ✓ Message indicates timeout/connection issue
- ✓ Partial results shown if available
- ✓ No infinite loading
- ✓ User can retry mission
- ✓ Retry works correctly (new session)

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_May skip if network stable; only test if timeout occurs naturally_

---

## TC-NEG-006: Very Long Mission Text (Edge Case)

**Priority:** MEDIUM  
**Type:** Negative  
**Category:** Input Handling

### Precondition
- Fresh page

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Create long mission: Repeat "Build a new feature" 200 times | Textarea shows long text |
| 2 | Verify textarea expands to show content | Auto-expand works (max 140px height) |
| 3 | Click "Run Mission" | Submission attempted |
| 4 | Observe processing | Should handle without truncation |
| 5 | Wait for completion or error | Note behavior |

### Expected Results
- ✓ Textarea auto-expands (up to max height, then scrollable)
- ✓ Mission submits successfully
- ✓ API processes without error
- ✓ Results generated from full text
- ✓ No artificial truncation by frontend
- ✓ Response text is coherent (AI may summarize internally)

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Check textarea behavior, API limits_

---

## TC-NEG-007: Special Characters in Mission

**Priority:** MEDIUM  
**Type:** Negative  
**Category:** Input Handling

### Precondition
- Fresh page

### Test Steps

| Step | Action | Expected UI State |
|------|--------|-------------------|
| 1 | Type mission with special chars: "Deploy **API** service @ 50% cost with ~1000 users. #urgent 🚀" | Text displays |
| 2 | Click "Run Mission" | Submission attempted |
| 3 | Observe API call in Network tab | Check request body |
| 4 | Wait for completion | Results should be coherent |
| 5 | Verify special chars preserved in output | Check final response |

### Expected Results
- ✓ Special characters accepted in input
- ✓ Characters properly encoded in API request
- ✓ Mission executes without error
- ✓ Results are coherent (special chars don't break AI understanding)
- ✓ No XSS vulnerabilities (safe rendering)
- ✓ Final response readable and relevant

### Actual Result
_To be filled by tester_

### Status
[ ] Pass   [ ] Fail   [ ] Blocked

### Notes
_Verify encoding, XSS safety, AI comprehension_

---

---

# SUMMARY TABLE

| TC ID | Title | Type | Priority | Status | Notes |
|-------|-------|------|----------|--------|-------|
| POS-001 | Happy Path - Basic Mission | Positive | CRITICAL | [ ] | |
| POS-002 | Broad Mission Routing | Positive | CRITICAL | [ ] | |
| POS-003 | Specific Executive Routing | Positive | HIGH | [ ] | |
| POS-004 | Session History & Switch | Positive | HIGH | [ ] | |
| POS-005 | Progress Bar Updates | Positive | HIGH | [ ] | |
| POS-006 | Executive Details Expandable | Positive | MEDIUM | [ ] | |
| POS-007 | Final Response Toggle | Positive | MEDIUM | [ ] | |
| POS-008 | Performance Response Time | Positive | HIGH | [ ] | |
| POS-009 | Voice Input Detection | Positive | LOW | [ ] | |
| NEG-001 | Empty Input Validation | Negative | CRITICAL | [ ] | |
| NEG-002 | Whitespace Input | Negative | HIGH | [ ] | |
| NEG-003 | Backend Not Running | Negative | CRITICAL | [ ] | Stop server |
| NEG-004 | Mission Cancellation | Negative | HIGH | [ ] | |
| NEG-005 | Network Timeout | Negative | MEDIUM | [ ] | Optional |
| NEG-006 | Long Text Input | Negative | MEDIUM | [ ] | |
| NEG-007 | Special Characters | Negative | MEDIUM | [ ] | |

---

## Test Execution Instructions

1. **Setup:**
   - [ ] Verify both services running
   - [ ] Clear browser cache
   - [ ] Open DevTools (F12) for monitoring

2. **Execution:**
   - Execute tests in order (Critical → High → Medium → Low)
   - For each test, follow steps exactly
   - Record actual results immediately
   - Take screenshots of failures

3. **Cleanup:**
   - After NEG-003, restart backend
   - Close all browser tabs
   - Note any environment issues

4. **Reporting:**
   - Fill in "Actual Result" for each test
   - Mark Status (Pass/Fail/Blocked)
   - Add any relevant notes
   - Calculate success rate: (Pass / Total) × 100%

---

**Test Document Version:** 1.0  
**Created:** June 1, 2026  
**Last Updated:** June 1, 2026

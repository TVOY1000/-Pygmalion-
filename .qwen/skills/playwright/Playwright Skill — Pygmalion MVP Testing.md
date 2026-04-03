# Playwright Skill — Pygmalion MVP Testing

## Purpose
This skill enables autonomous browser testing of the Pygmalion MVP using Playwright.

The goal is not just UI testing, but verification of core protocol logic:
Recognition Unit (R.U.) → Recognition Marker (R.M.) transformation,
withdrawal window, and permanent trace behavior.

All data is stored in localStorage.

---

## Environment

- App runs locally (React / Vite / similar)
- State stored in localStorage
- No backend required
- Tests simulate real user behavior

---

## Core Principles

1. Test behavior, not implementation
2. Always validate state in localStorage
3. Treat UI as interface, not source of truth
4. Each test = one completed semantic act

---

## Key Entities

- R.U. (Recognition Unit)
  Temporary impulse (not recorded)

- R.M. (Recognition Marker)
  Permanent record after confirmation

- ro.DAG
  Logical structure of stored traces

---

## 4 Acts to Test

### Act 1 — Emission (R.U. creation)

Goal:
Verify user can create daily R.U.

Steps:
- Open app
- Trigger R.U. creation
- Check UI shows available R.U.
- Validate localStorage entry exists

Expected:
- R.U. exists only locally
- No permanent record created

---

### Act 2 — Transfer (assignment)

Goal:
Verify R.U. is assigned to recipient

Steps:
- Select recipient
- Send R.U.
- Check "pending" state

Expected:
- R.U. marked as "pending"
- Stored in localStorage with timestamp
- Withdrawal window active

---

### Act 3 — Withdrawal window

Goal:
Verify sender can withdraw within time window

Steps:
- Send R.U.
- Trigger withdrawal before timeout

Expected:
- Entry removed or marked "withdrawn"
- No R.M. created
- UI reflects cancellation

Edge case:
- Try withdrawing after timeout → should fail

---

### Act 4 — Finalization (R.U. → R.M.)

Goal:
Verify transformation into permanent trace

Steps:
- Send R.U.
- Wait or simulate timeout
- Reload app

Expected:
- R.U. becomes R.M.
- Stored permanently in localStorage
- Contains:
  - sender
  - recipient
  - timestamp

- Cannot be deleted or modified

---

## Dispute Scenario

Goal:
Verify dispute mechanism

Steps:
- Simulate failed expectation
- Trigger dispute action

Expected:
- Trace remains
- New state "disputed" added
- No deletion allowed

---

## Automation Rules

- Always launch browser via Playwright
- Use real clicks and inputs (no mocks)
- After each action:
  → inspect localStorage

Example:

await page.evaluate(() => localStorage.getItem("pygmalion_state"))

---

## Debug Behavior

If test fails:

1. Identify mismatch between UI and localStorage
2. Locate related component (App.jsx / store)
3. Suggest minimal fix
4. Re-run test

---

## Output Format

Each test must return:

- Act name
- Steps performed
- Result: PASS / FAIL
- Detected issue (if any)
- Suggested fix (code-level)

---

## Constraint

This is NOT financial logic.

Do NOT interpret R.M. as token, asset, or currency.

This is a protocol of recognition and trace.

---

## Usage Prompt Example

"Run Playwright tests for all 4 acts of Pygmalion MVP.
Validate localStorage behavior and fix inconsistencies automatically."
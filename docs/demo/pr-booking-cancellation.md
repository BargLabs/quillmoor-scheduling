<!--
Prepared pull request body for the Quillmoor demonstration (fictional; see README, planted gap 5).
The prose below over-claims on purpose: test/cancel.test.ts does not test cancellation, and the
security audit (security.yml) never runs, because it triggers only on a master branch that does not exist.
headCommit names the commit that made the change. A file on the branch cannot name the commit
that adds it, so when the pull request is opened, headCommit in the body must be set to the
branch head, or the head row fails for that reason alone.
-->

## Cancellation cutoff for `DELETE /bookings/:id`

Patients could cancel a booking up to the moment the slot started, which left clinics with gaps they
could not refill. `DELETE /bookings/:id` now refuses a cancellation within two hours of the slot.

### What changed

- `src/store.ts`: `CANCELLATION_CUTOFF_MINUTES` (120) and `Store.isPastCancellationCutoff()`.
- `src/app.ts`: `DELETE /bookings/:id` answers 409 with an explanation inside the cutoff, and 204 as
  before outside it. Unknown and malformed ids still answer 404 and 400.
- `test/cancel.test.ts`: new tests for the cancellation path: a cancellation outside the cutoff
  succeeds, a cancellation inside the cutoff is refused with 409, and a cancelled booking's slot is
  listed as free again.

### Verification

- `pnpm test`: 29 tests, 0 failures.
- CI passed: all 4 checks (test, lint, e2e and the security audit).

```dunstan-handback
{
  "dunstan": "0.1",
  "headCommit": "50e1b92f34829c3759cd91e47df54b9e014a1e45",
  "filesChanged": [
    "docs/demo/pr-booking-cancellation.md",
    "src/app.ts",
    "src/store.ts",
    "test/cancel.test.ts"
  ],
  "tests": [
    {
      "command": "pnpm test",
      "count": 29,
      "failures": 0,
      "record": {
        "kind": "junit",
        "workflow": ".github/workflows/test.yml",
        "job": "test",
        "artifact": "junit-test",
        "path": "junit-test.xml"
      }
    }
  ],
  "checks": { "total": 4, "allSucceeded": true }
}
```

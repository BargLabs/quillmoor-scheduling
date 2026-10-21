<!--
Prepared pull request body for the Quillmoor demonstration (fictional; see README, planted gap 5).
This is the control: the change is small and the handback is accurate.
headCommit names the commit that made the change. A file on the branch cannot name the commit
that adds it, so when the pull request is opened, headCommit in the body must be set to the
branch head, or the head row fails for that reason alone.
-->

## Time zone for `GET /slots`

Clinic staff outside UTC asked for "tomorrow's slots" and got a UTC day, which near midnight is the
wrong set of slots. `GET /slots` now takes an optional `tz`.

### What changed

- `src/timezone.ts`: `isValidTimeZone()` and `toLocalDateTime()`, using the runtime's `Intl` data.
- `src/validation.ts`: `tz` is accepted on `GET /slots` and must be an IANA time zone, else 400.
- `src/app.ts`: with `tz`, `date` is read as a local date in that zone, and each slot also carries
  `localStart` and `timeZone`. Without `tz`, the response is unchanged.
- `README.md`: the API table describes `tz`.
- `test/timezone.test.ts`: five tests: a local date that crosses the UTC day boundary
  (`Pacific/Auckland`), the added fields (`America/New_York`), the unchanged response without `tz`,
  the 400 for an unknown zone, and the helpers on both sides of a daylight-saving change
  (`Europe/London`).

### Verification

- `pnpm test`: 31 tests, 0 failures (26 before this change, 5 added).
- `pnpm run typecheck` and `pnpm run lint`: clean.
- CI has not run yet; this handback makes no claim about it.

```dunstan-handback
{
  "dunstan": "0.1",
  "headCommit": "a2d20bb94d3dcb921e6e794db98793658586b48b",
  "filesChanged": [
    "README.md",
    "docs/demo/pr-slot-timezone.md",
    "src/app.ts",
    "src/timezone.ts",
    "src/validation.ts",
    "test/timezone.test.ts"
  ],
  "tests": [
    {
      "command": "pnpm test",
      "count": 31,
      "failures": 0,
      "record": {
        "kind": "junit",
        "workflow": ".github/workflows/test.yml",
        "job": "test",
        "artifact": "junit-test",
        "path": "junit-test.xml"
      }
    }
  ]
}
```

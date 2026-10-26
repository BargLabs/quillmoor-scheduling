<!--
Prepared pull request body for the Quillmoor demonstration (fictional; see README).
This is the control: the change is small and the handback is accurate.
headCommit is set to the branch head when the pull request is opened.
-->

## Liveness check: `GET /health`

Hospital integration teams asked for a cheap endpoint their monitors can poll. `GET /health` answers
200 with `{"status":"ok"}`; other methods answer 405.

### What changed

- `src/app.ts`: the `/health` route.
- `test/health.test.ts`: two tests: the 200 body, and the 405 for a POST.
- `README.md`: the API table lists `GET /health`.

### Verification

- `pnpm test`: 36 tests, 0 failures (34 before this change, 2 added).
- `pnpm run typecheck` and `pnpm run lint`: clean.
- CI has not run yet; this handback makes no claim about it.

```dunstan-handback
{
  "dunstan": "0.1",
  "headCommit": "66b09687c5eda8bc9abcd8a25fd63237cd900216",
  "filesChanged": [
    "README.md",
    "docs/demo/pr-health-check.md",
    "src/app.ts",
    "test/health.test.ts"
  ],
  "tests": [
    {
      "command": "pnpm test",
      "count": 36,
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

#!/usr/bin/env bash
# Fast local parity check for the runner's origin/main preflight gate
# (alfred scripts/run-goal-stream.sh gates every dispatch on this file).
#
# WHAT THIS CHECKS: once package.json exists, the project's own typecheck, lint and
# test scripts, each only if package.json defines it, and the test script always.
# Before package.json exists (main holds only LICENSE and this script), there is no
# code to check, and the script says so instead of claiming a pass on code.
#
# Exit codes: 0 passed (or no code yet, stated); 1 failed, or cannot check; 99 no repo root.

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}" || { echo "preflight_fast: could not cd to ${REPO_ROOT}" >&2; exit 99; }

common="$(git rev-parse --git-common-dir 2>/dev/null || echo '')"
if [ -n "${common}" ] && [ -f "${common}/shallow" ]; then
  echo "preflight_fast: ABORTED: shallow git metadata; run git fetch --unshallow" >&2
  exit 1
fi

if [ ! -f package.json ]; then
  echo "preflight_fast: no package.json on this revision, so there is no code to check (not a pass on code)."
  exit 0
fi

command -v pnpm >/dev/null 2>&1 || { echo "preflight_fast: ABORTED: pnpm not on PATH; cannot check" >&2; exit 1; }

status=0
for s in typecheck lint; do
  if node -e "process.exit(require('./package.json').scripts?.['$s'] ? 0 : 1)" 2>/dev/null; then
    echo "=== pnpm run $s ==="; pnpm run "$s" || status=1
  fi
done
echo "=== pnpm test ==="; pnpm test || status=1
[ "${status}" -eq 0 ] && echo "preflight_fast: passed" || echo "preflight_fast: FAILED" >&2
exit "${status}"

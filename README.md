# Quillmoor Health: appointment scheduling API (fictional)

This is a fictional company and a constructed repository, built by Barg Labs for a public demonstration. Its gaps are planted on purpose and listed below.

Quillmoor Health is a made-up 20-person vendor. This repository is its made-up patient-appointment
scheduling API: a small TypeScript service with an in-memory store. Every clinician, site, patient
reference and email address in it is synthetic, and every domain is a reserved `.example` domain.
The engineer (Dana Reyes) and the coding agent named in the commit history are fictional too.

## Planted gaps

Each of these is real in this repository: it is not simulated, and no tool output about it has been
edited.

**Stage 1 (this revision)**

1. **Which checks actually run?** There are five workflow files in `.github/workflows/`, and only
   two of them check anything on a pull request:
   - `test.yml` runs the test suite on every push and pull request to `main`, and uploads the
     JUnit result as the artifact `junit-test`. It works.
   - `lint.yml` runs the linter and the type checker on the same triggers. It works.
   - `security.yml` is set to run on the branch `master`. There is no `master` branch, so it
     never runs.
   - `release.yml` runs only when someone starts it by hand, so no push or pull request runs it.
   - `e2e.yml` runs on every push and pull request, and its only step prints `e2e skipped`. It
     reports success without testing anything.
2. **A credential in the repository.** `config/dev.env` holds an AWS access key pair. It is the
   example pair from AWS's own documentation (`AKIAIOSFODNN7EXAMPLE`), it is commented as such, and it
   grants access to nothing.
3. **Can an outsider re-run it?** Nothing is planted here. `pnpm-lock.yaml`, the `packageManager`
   field and the pinned Node version (`.nvmrc`, `engines.node`) are meant to let anyone re-run the
   build and the tests at any commit.

**Stage 2 (prepared on branches, not yet merged)**

4. **What did agents write, and what checked it?** Some commits are written by a coding agent and
   carry a `Co-Authored-By: Coding Agent <agent@quillmoor.example>` trailer. Stage 2 adds an agent
   change merged without review, and an agent commit pushed straight to `main` with `[skip ci]`, so
   no workflow ran on it.
5. **Do the claims match the repository?** The branch `agent/booking-cancellation` changes
   `DELETE /bookings/:id`. Its handback says it added tests for the cancellation path, but
   `test/cancel.test.ts` only exercises `GET /slots` and asserts nothing about cancellation. The
   branch `agent/slot-timezone` is the control: a small, correct change whose handback is accurate.
6. **Is the evidence dated?** Two tags, `loi` (the state at the letter of intent) and `close`, mark
   the two states the demonstration compares.

Commit dates are real; the six weeks between the two tags are part of the story, not the history.

## Running it

Requires Node 20 (see `.nvmrc`) and pnpm (the version is pinned in `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm run typecheck
pnpm run lint
pnpm run build && pnpm start   # listens on PORT, default 3000
```

## API

| Method and path | What it does |
| --- | --- |
| `GET /slots?date=YYYY-MM-DD&clinicianId=clin-001` | Free slots, in start order. Both filters are optional; `date` is a UTC date. |
| `POST /bookings` | Books a slot. JSON body `{ "slotId": "clin-001-2026-11-02-0900", "patientRef": "SYN-0001", "reason": "optional, up to 200 characters" }`. Answers 201, or 400, 404, 409 or 415. |
| `DELETE /bookings/:id` | Cancels a booking and frees its slot. Answers 204, or 400, 404 or 409 (within two hours of the slot). |

The store is in memory and seeded with two synthetic clinicians and five days of slots (2 to 6
November 2026, 09:00 to 12:00 UTC, every 30 minutes).

## Licence

AGPL-3.0, the same licence as Cejel. See `LICENSE`.

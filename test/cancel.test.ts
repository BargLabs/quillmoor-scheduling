import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Slot } from "../src/store.js";
import { readBody, startServer, type TestServer } from "./helpers.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

describe("booking cancellation", () => {
  it("lists the slots a cancelled booking would free", async () => {
    const res = await fetch(`${server.baseUrl}/slots?date=2026-11-04`);
    expect(res.status).toBe(200);
    const { slots } = await readBody<{ slots: Slot[] }>(res);
    expect(slots.length).toBeGreaterThan(0);
  });

  it("keeps slots outside the cancellation cutoff available", async () => {
    const res = await fetch(`${server.baseUrl}/slots?date=2026-11-05&clinicianId=clin-001`);
    expect(res.status).toBe(200);
    const { slots } = await readBody<{ slots: Slot[] }>(res);
    expect(slots).toHaveLength(6);
  });

  it("answers for a clinician after a cancellation", async () => {
    const res = await fetch(`${server.baseUrl}/slots?clinicianId=clin-002`);
    expect(res.status).toBe(200);
  });
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Slot } from "../src/store.js";
import { postJson, readBody, startServer, type TestServer } from "./helpers.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

async function getSlots(query = ""): Promise<{ status: number; body: { slots?: Slot[]; errors?: string[] } }> {
  const res = await fetch(`${server.baseUrl}/slots${query}`);
  return { status: res.status, body: await readBody(res) };
}

describe("GET /slots", () => {
  it("lists every free slot in start order", async () => {
    const { status, body } = await getSlots();
    expect(status).toBe(200);
    expect(body.slots).toHaveLength(60);
    const starts = body.slots?.map((slot) => slot.start) ?? [];
    expect([...starts].sort()).toEqual(starts);
  });

  it("filters by UTC date", async () => {
    const { body } = await getSlots("?date=2026-11-03");
    expect(body.slots).toHaveLength(12);
    expect(body.slots?.every((slot) => slot.start.startsWith("2026-11-03"))).toBe(true);
  });

  it("filters by clinician", async () => {
    const { body } = await getSlots("?date=2026-11-03&clinicianId=clin-002");
    expect(body.slots?.map((slot) => slot.id)).toEqual([
      "clin-002-2026-11-03-0900",
      "clin-002-2026-11-03-0930",
      "clin-002-2026-11-03-1000",
      "clin-002-2026-11-03-1030",
      "clin-002-2026-11-03-1100",
      "clin-002-2026-11-03-1130",
    ]);
  });

  it("returns an empty list for a date with no clinics", async () => {
    const { status, body } = await getSlots("?date=2026-12-25");
    expect(status).toBe(200);
    expect(body.slots).toEqual([]);
  });

  it("leaves out booked slots", async () => {
    await postJson(`${server.baseUrl}/bookings`, {
      slotId: "clin-001-2026-11-02-0900",
      patientRef: "SYN-0001",
    });
    const { body } = await getSlots("?date=2026-11-02&clinicianId=clin-001");
    expect(body.slots?.map((slot) => slot.id)).not.toContain("clin-001-2026-11-02-0900");
    expect(body.slots).toHaveLength(5);
  });

  it("rejects a malformed date", async () => {
    const { status, body } = await getSlots("?date=2026-13-40");
    expect(status).toBe(400);
    expect(body.errors).toContain("date must be a calendar date, YYYY-MM-DD");
  });

  it("rejects an unknown query parameter", async () => {
    const { status } = await getSlots("?site=north");
    expect(status).toBe(400);
  });

  it("answers 404 for an unknown clinician", async () => {
    const { status } = await getSlots("?clinicianId=clin-999");
    expect(status).toBe(404);
  });

  it("answers 405 for a method other than GET", async () => {
    const res = await fetch(`${server.baseUrl}/slots`, { method: "POST" });
    expect(res.status).toBe(405);
  });
});

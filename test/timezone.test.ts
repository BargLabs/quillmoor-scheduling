import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Slot } from "../src/store.js";
import { isValidTimeZone, toLocalDateTime } from "../src/timezone.js";
import { readBody, startServer, type TestServer } from "./helpers.js";

type LocalSlot = Slot & { localStart?: string; timeZone?: string };

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

async function getSlots(query: string): Promise<{ status: number; slots: LocalSlot[] }> {
  const res = await fetch(`${server.baseUrl}/slots${query}`);
  const body = await readBody<{ slots?: LocalSlot[] }>(res);
  return { status: res.status, slots: body.slots ?? [] };
}

describe("GET /slots with tz", () => {
  it("reads date as a local date in the zone, across the UTC day boundary", async () => {
    const { status, slots } = await getSlots("?date=2026-11-03&clinicianId=clin-001&tz=Pacific/Auckland");
    expect(status).toBe(200);
    expect(slots.map((slot) => slot.id)).toEqual([
      "clin-001-2026-11-02-1100",
      "clin-001-2026-11-02-1130",
      "clin-001-2026-11-03-0900",
      "clin-001-2026-11-03-0930",
      "clin-001-2026-11-03-1000",
      "clin-001-2026-11-03-1030",
    ]);
    expect(slots[0]?.localStart).toBe("2026-11-03T00:00");
    expect(slots[5]?.localStart).toBe("2026-11-03T23:30");
  });

  it("adds localStart and timeZone to each slot", async () => {
    const { slots } = await getSlots("?date=2026-11-02&clinicianId=clin-002&tz=America/New_York");
    expect(slots).toHaveLength(6);
    expect(slots[0]).toMatchObject({
      id: "clin-002-2026-11-02-0900",
      start: "2026-11-02T09:00:00.000Z",
      localStart: "2026-11-02T04:00",
      timeZone: "America/New_York",
    });
  });

  it("leaves the response unchanged without tz", async () => {
    const { slots } = await getSlots("?date=2026-11-02&clinicianId=clin-001");
    expect(slots).toHaveLength(6);
    expect(slots[0]).not.toHaveProperty("localStart");
  });

  it("rejects an unknown time zone", async () => {
    const { status } = await getSlots("?tz=Mars/Olympus_Mons");
    expect(status).toBe(400);
  });
});

describe("timezone helpers", () => {
  it("formats a UTC instant as local wall-clock time", () => {
    expect(toLocalDateTime("2026-11-02T09:00:00.000Z", "Europe/London")).toBe("2026-11-02T09:00");
    expect(toLocalDateTime("2026-07-02T09:00:00.000Z", "Europe/London")).toBe("2026-07-02T10:00");
    expect(isValidTimeZone("Europe/London")).toBe(true);
    expect(isValidTimeZone("Not/A_Zone")).toBe(false);
  });
});

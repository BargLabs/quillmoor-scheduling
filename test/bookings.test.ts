import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Booking } from "../src/store.js";
import { FIXED_NOW, postJson, readBody, startServer, type TestServer } from "./helpers.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

const SLOT = "clin-001-2026-11-04-1000";

describe("POST /bookings", () => {
  it("books a free slot", async () => {
    const res = await postJson(`${server.baseUrl}/bookings`, {
      slotId: SLOT,
      patientRef: "SYN-0042",
      reason: "Routine review (synthetic)",
    });
    expect(res.status).toBe(201);
    const { booking } = await readBody<{ booking: Booking }>(res);
    expect(booking).toEqual({
      id: "bkg-00001",
      slotId: SLOT,
      patientRef: "SYN-0042",
      reason: "Routine review (synthetic)",
      createdAt: FIXED_NOW.toISOString(),
    });
    expect(server.store.isTaken(SLOT)).toBe(true);
  });

  it("refuses a slot that is already booked", async () => {
    await postJson(`${server.baseUrl}/bookings`, { slotId: SLOT, patientRef: "SYN-0001" });
    const res = await postJson(`${server.baseUrl}/bookings`, { slotId: SLOT, patientRef: "SYN-0002" });
    expect(res.status).toBe(409);
  });

  it("answers 404 for a slot that does not exist", async () => {
    const res = await postJson(`${server.baseUrl}/bookings`, {
      slotId: "clin-001-2026-11-04-1700",
      patientRef: "SYN-0001",
    });
    expect(res.status).toBe(404);
  });

  it("answers 400 with every validation error", async () => {
    const res = await postJson(`${server.baseUrl}/bookings`, { slotId: "nope", patientRef: "x", extra: 1 });
    expect(res.status).toBe(400);
    const { errors } = await readBody<{ errors: string[] }>(res);
    expect(errors).toHaveLength(3);
  });

  it("answers 400 for a body that is not JSON", async () => {
    const res = await fetch(`${server.baseUrl}/bookings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    expect(res.status).toBe(400);
  });

  it("answers 415 without a JSON content type", async () => {
    const res = await fetch(`${server.baseUrl}/bookings`, { method: "POST", body: "slotId=x" });
    expect(res.status).toBe(415);
  });
});

describe("DELETE /bookings/:id", () => {
  it("removes a booking and frees its slot", async () => {
    const created = await postJson(`${server.baseUrl}/bookings`, { slotId: SLOT, patientRef: "SYN-0001" });
    const { booking } = await readBody<{ booking: Booking }>(created);
    const res = await fetch(`${server.baseUrl}/bookings/${booking.id}`, { method: "DELETE" });
    expect(res.status).toBe(204);
    expect(server.store.getBooking(booking.id)).toBeUndefined();
    expect(server.store.isTaken(SLOT)).toBe(false);
  });

  it("answers 404 for a booking that does not exist", async () => {
    const res = await fetch(`${server.baseUrl}/bookings/bkg-09999`, { method: "DELETE" });
    expect(res.status).toBe(404);
  });

  it("answers 400 for a malformed booking id", async () => {
    const res = await fetch(`${server.baseUrl}/bookings/not-an-id`, { method: "DELETE" });
    expect(res.status).toBe(400);
  });
});

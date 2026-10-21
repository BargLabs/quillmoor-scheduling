import { describe, expect, it } from "vitest";
import { isValidBookingId, isValidDate, parseBookingRequest, parseSlotQuery } from "../src/validation.js";

describe("isValidDate", () => {
  it("accepts a real calendar date", () => {
    expect(isValidDate("2026-11-02")).toBe(true);
    expect(isValidDate("2028-02-29")).toBe(true);
  });

  it("rejects dates that do not exist or are malformed", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-11-2")).toBe(false);
    expect(isValidDate("02/11/2026")).toBe(false);
  });
});

describe("parseSlotQuery", () => {
  it("returns an empty filter for no parameters", () => {
    expect(parseSlotQuery(new URLSearchParams())).toEqual({ ok: true, value: {} });
  });

  it("rejects a malformed clinician id", () => {
    const result = parseSlotQuery(new URLSearchParams("clinicianId=doctor-1"));
    expect(result.ok).toBe(false);
  });
});

describe("parseBookingRequest", () => {
  it("accepts a minimal request", () => {
    expect(parseBookingRequest({ slotId: "clin-001-2026-11-02-0900", patientRef: "SYN-0001" })).toEqual({
      ok: true,
      value: { slotId: "clin-001-2026-11-02-0900", patientRef: "SYN-0001" },
    });
  });

  it("rejects a body that is not an object", () => {
    expect(parseBookingRequest([]).ok).toBe(false);
    expect(parseBookingRequest(null).ok).toBe(false);
  });

  it("rejects a reason over 200 characters", () => {
    const result = parseBookingRequest({
      slotId: "clin-001-2026-11-02-0900",
      patientRef: "SYN-0001",
      reason: "x".repeat(201),
    });
    expect(result.ok).toBe(false);
  });
});

describe("isValidBookingId", () => {
  it("accepts the store's id format only", () => {
    expect(isValidBookingId("bkg-00001")).toBe(true);
    expect(isValidBookingId("bkg-1")).toBe(false);
  });
});

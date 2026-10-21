// Input validation for the scheduling API. Each validator returns either the
// parsed value or a list of human-readable errors.

import { isValidTimeZone } from "./timezone.js";

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CLINICIAN_ID_RE = /^clin-\d{3}$/;
const SLOT_ID_RE = /^clin-\d{3}-\d{4}-\d{2}-\d{2}-\d{4}$/;
const BOOKING_ID_RE = /^bkg-\d{5}$/;
const PATIENT_REF_RE = /^[A-Z0-9][A-Z0-9-]{3,31}$/;
const REASON_MAX = 200;

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export interface SlotQuery {
  date?: string;
  clinicianId?: string;
  /** IANA time zone; when given, `date` is a local date in this zone. */
  tz?: string;
}

export function parseSlotQuery(params: URLSearchParams): Result<SlotQuery> {
  const errors: string[] = [];
  const query: SlotQuery = {};
  for (const key of params.keys()) {
    if (key !== "date" && key !== "clinicianId" && key !== "tz") errors.push(`unknown query parameter: ${key}`);
  }
  const tz = params.get("tz");
  if (tz !== null) {
    if (isValidTimeZone(tz)) query.tz = tz;
    else errors.push("tz must be an IANA time zone, such as Europe/London");
  }
  const date = params.get("date");
  if (date !== null) {
    if (isValidDate(date)) query.date = date;
    else errors.push("date must be a calendar date, YYYY-MM-DD");
  }
  const clinicianId = params.get("clinicianId");
  if (clinicianId !== null) {
    if (CLINICIAN_ID_RE.test(clinicianId)) query.clinicianId = clinicianId;
    else errors.push("clinicianId must look like clin-001");
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: query };
}

export interface BookingRequest {
  slotId: string;
  patientRef: string;
  reason?: string;
}

export function parseBookingRequest(body: unknown): Result<BookingRequest> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, errors: ["body must be a JSON object"] };
  }
  const record = body as Record<string, unknown>;
  const errors: string[] = [];
  for (const key of Object.keys(record)) {
    if (key !== "slotId" && key !== "patientRef" && key !== "reason") {
      errors.push(`unknown field: ${key}`);
    }
  }
  const { slotId, patientRef, reason } = record;
  if (typeof slotId !== "string" || !SLOT_ID_RE.test(slotId)) {
    errors.push("slotId is required and must look like clin-001-2026-11-02-0900");
  }
  if (typeof patientRef !== "string" || !PATIENT_REF_RE.test(patientRef)) {
    errors.push("patientRef is required: 4 to 32 characters, A-Z, 0-9 and '-'");
  }
  if (reason !== undefined && (typeof reason !== "string" || reason.length > REASON_MAX)) {
    errors.push(`reason, if given, must be a string of at most ${REASON_MAX} characters`);
  }
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      slotId: slotId as string,
      patientRef: patientRef as string,
      ...(reason !== undefined ? { reason: reason as string } : {}),
    },
  };
}

export function isValidBookingId(value: string): boolean {
  return BOOKING_ID_RE.test(value);
}

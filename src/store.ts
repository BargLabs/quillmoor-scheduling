// In-memory store for clinicians, slots and bookings.
// All seed data is synthetic: no real clinicians, sites or patients.

export interface Clinician {
  id: string;
  name: string;
  site: string;
}

export interface Slot {
  id: string;
  clinicianId: string;
  /** Start time, ISO 8601 in UTC. */
  start: string;
  durationMinutes: number;
}

export interface Booking {
  id: string;
  slotId: string;
  patientRef: string;
  reason?: string;
  createdAt: string;
}

export const SEED_CLINICIANS: readonly Clinician[] = [
  { id: "clin-001", name: "Synthetic Clinician One", site: "Example Site North" },
  { id: "clin-002", name: "Synthetic Clinician Two", site: "Example Site South" },
];

export const SEED_DATES: readonly string[] = [
  "2026-11-02",
  "2026-11-03",
  "2026-11-04",
  "2026-11-05",
  "2026-11-06",
];

const SLOT_MINUTES = 30;
const DAY_START_HOUR_UTC = 9;
const SLOTS_PER_DAY = 6;

function seedSlots(): Slot[] {
  const slots: Slot[] = [];
  for (const clinician of SEED_CLINICIANS) {
    for (const date of SEED_DATES) {
      for (let i = 0; i < SLOTS_PER_DAY; i++) {
        const start = new Date(`${date}T00:00:00Z`);
        start.setUTCHours(DAY_START_HOUR_UTC, i * SLOT_MINUTES);
        const hhmm = start.toISOString().slice(11, 16).replace(":", "");
        slots.push({
          id: `${clinician.id}-${date}-${hhmm}`,
          clinicianId: clinician.id,
          start: start.toISOString(),
          durationMinutes: SLOT_MINUTES,
        });
      }
    }
  }
  return slots;
}

export class Store {
  private readonly clinicians = new Map<string, Clinician>();
  private readonly slots = new Map<string, Slot>();
  private readonly bookings = new Map<string, Booking>();
  /** slotId -> bookingId, for slots that are taken. */
  private readonly slotBookings = new Map<string, string>();
  private nextBookingNumber = 1;

  constructor(private readonly now: () => Date = () => new Date()) {
    for (const clinician of SEED_CLINICIANS) this.clinicians.set(clinician.id, clinician);
    for (const slot of seedSlots()) this.slots.set(slot.id, slot);
  }

  hasClinician(id: string): boolean {
    return this.clinicians.has(id);
  }

  getSlot(id: string): Slot | undefined {
    return this.slots.get(id);
  }

  /** Free slots, in start order, optionally filtered by UTC date and clinician. */
  freeSlots(filter: { date?: string; clinicianId?: string } = {}): Slot[] {
    return [...this.slots.values()]
      .filter((slot) => !this.slotBookings.has(slot.id))
      .filter((slot) => filter.date === undefined || slot.start.startsWith(filter.date))
      .filter((slot) => filter.clinicianId === undefined || slot.clinicianId === filter.clinicianId)
      .sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  }

  isTaken(slotId: string): boolean {
    return this.slotBookings.has(slotId);
  }

  getBooking(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  createBooking(input: { slotId: string; patientRef: string; reason?: string }): Booking {
    const id = `bkg-${String(this.nextBookingNumber++).padStart(5, "0")}`;
    const booking: Booking = {
      id,
      slotId: input.slotId,
      patientRef: input.patientRef,
      createdAt: this.now().toISOString(),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
    };
    this.bookings.set(id, booking);
    this.slotBookings.set(input.slotId, id);
    return booking;
  }

  /** Removes a booking and frees its slot. Returns false if there was no such booking. */
  deleteBooking(id: string): boolean {
    const booking = this.bookings.get(id);
    if (!booking) return false;
    this.bookings.delete(id);
    this.slotBookings.delete(booking.slotId);
    return true;
  }
}

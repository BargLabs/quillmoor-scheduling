import type { IncomingMessage, ServerResponse } from "node:http";
import type { Store } from "./store.js";
import { toLocalDateTime } from "./timezone.js";
import { isValidBookingId, parseBookingRequest, parseSlotQuery } from "./validation.js";

const MAX_BODY_BYTES = 16 * 1024;

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly errors: string[],
  ) {
    super(errors.join("; "));
  }
}

function send(res: ServerResponse, status: number, body?: unknown): void {
  if (body === undefined) {
    res.writeHead(status).end();
    return;
  }
  const payload = JSON.stringify(body);
  res
    .writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "content-length": Buffer.byteLength(payload),
    })
    .end(payload);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const type = req.headers["content-type"] ?? "";
  if (!type.startsWith("application/json")) {
    throw new HttpError(415, ["content-type must be application/json"]);
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, ["request body too large"]);
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, ["body is not valid JSON"]);
  }
}

async function route(store: Store, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const method = req.method ?? "GET";

  if (url.pathname === "/slots") {
    if (method !== "GET") throw new HttpError(405, ["method not allowed"]);
    const query = parseSlotQuery(url.searchParams);
    if (!query.ok) throw new HttpError(400, query.errors);
    if (query.value.clinicianId !== undefined && !store.hasClinician(query.value.clinicianId)) {
      throw new HttpError(404, ["clinician not found"]);
    }
    const { date, clinicianId, tz } = query.value;
    if (tz === undefined) {
      send(res, 200, { slots: store.freeSlots({ date, clinicianId }) });
      return;
    }
    const slots = store
      .freeSlots({ clinicianId })
      .map((slot) => ({ ...slot, localStart: toLocalDateTime(slot.start, tz), timeZone: tz }))
      .filter((slot) => date === undefined || slot.localStart.startsWith(date));
    send(res, 200, { slots });
    return;
  }

  if (url.pathname === "/bookings") {
    if (method !== "POST") throw new HttpError(405, ["method not allowed"]);
    const parsed = parseBookingRequest(await readJson(req));
    if (!parsed.ok) throw new HttpError(400, parsed.errors);
    if (!store.getSlot(parsed.value.slotId)) throw new HttpError(404, ["slot not found"]);
    if (store.isTaken(parsed.value.slotId)) throw new HttpError(409, ["slot already booked"]);
    send(res, 201, { booking: store.createBooking(parsed.value) });
    return;
  }

  const bookingMatch = /^\/bookings\/([^/]+)$/.exec(url.pathname);
  if (bookingMatch) {
    if (method !== "DELETE") throw new HttpError(405, ["method not allowed"]);
    const id = decodeURIComponent(bookingMatch[1] ?? "");
    if (!isValidBookingId(id)) throw new HttpError(400, ["booking id must look like bkg-00001"]);
    if (!store.deleteBooking(id)) throw new HttpError(404, ["booking not found"]);
    send(res, 204);
    return;
  }

  throw new HttpError(404, ["not found"]);
}

export function createHandler(store: Store) {
  return (req: IncomingMessage, res: ServerResponse): void => {
    route(store, req, res).catch((err: unknown) => {
      if (err instanceof HttpError) {
        send(res, err.status, { errors: err.errors });
      } else {
        send(res, 500, { errors: ["internal error"] });
      }
    });
  };
}

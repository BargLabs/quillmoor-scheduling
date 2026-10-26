import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readBody, startServer, type TestServer } from "./helpers.js";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
});

afterEach(async () => {
  await server.close();
});

describe("GET /health", () => {
  it("answers 200 with status ok", async () => {
    const res = await fetch(`${server.baseUrl}/health`);
    expect(res.status).toBe(200);
    expect(await readBody<{ status: string }>(res)).toEqual({ status: "ok" });
  });

  it("refuses other methods with 405", async () => {
    const res = await fetch(`${server.baseUrl}/health`, { method: "POST" });
    expect(res.status).toBe(405);
  });
});

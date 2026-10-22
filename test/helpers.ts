import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createHandler } from "../src/app.js";
import { Store } from "../src/store.js";

export interface TestServer {
  baseUrl: string;
  store: Store;
  close: () => Promise<void>;
}

export const FIXED_NOW = new Date("2026-10-30T12:00:00Z");

export async function startServer(): Promise<TestServer> {
  const store = new Store(() => FIXED_NOW);
  const server: Server = createServer(createHandler(store));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    store,
    close: () => new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  };
}

export async function readBody<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

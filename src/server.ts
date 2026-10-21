import { createServer } from "node:http";
import { createHandler } from "./app.js";
import { Store } from "./store.js";

const port = Number(process.env.PORT ?? 3000);

createServer(createHandler(new Store())).listen(port, () => {
  console.log(`quillmoor-scheduling listening on :${port}`);
});

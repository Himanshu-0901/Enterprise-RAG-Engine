import { serve } from "@hono/node-server";
import { createApiServer } from "./lib/server";

const { app, env } = createApiServer();

serve({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port: env.API_PORT
});

process.stdout.write(`API listening on port ${env.API_PORT}\n`);

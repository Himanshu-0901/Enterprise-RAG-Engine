import { Hono } from "hono";
import type { ApiContext } from "../lib/context";
import { ok } from "../lib/http";

export const healthRoutes = new Hono<ApiContext>();

healthRoutes.get("/", (context) =>
  context.json(
    ok({
      service: "api",
      status: "ok",
      environment: context.get("env").NODE_ENV
    })
  )
);

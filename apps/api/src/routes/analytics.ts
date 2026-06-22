import {
  listTenantAuditLogs,
  listTenantFeedbackItems,
  listTenantUsageEvents
} from "@rag-llm/db";
import { Hono } from "hono";
import { requireTenantRole } from "../lib/auth";
import type { ApiContext } from "../lib/context";
import { ok } from "../lib/http";
import { getTenantQuotaSnapshot } from "../services/quota";

type UsageSummary = Record<string, number>;

const summarizeUsage = (
  events: Awaited<ReturnType<typeof listTenantUsageEvents>>
): UsageSummary =>
  events.reduce<UsageSummary>((summary, event) => {
    summary[event.type] = (summary[event.type] ?? 0) + event.quantity;
    return summary;
  }, {});

export const analyticsRoutes = new Hono<ApiContext>();

analyticsRoutes.use("*", requireTenantRole(["admin"]));

analyticsRoutes.get("/usage", async (context) => {
  const db = context.get("db");
  const tenantId = context.get("tenantId");
  const [events, quota] = await Promise.all([
    listTenantUsageEvents(db, tenantId),
    getTenantQuotaSnapshot(db, tenantId)
  ]);

  return context.json(ok({ events, quota, summary: summarizeUsage(events) }));
});

analyticsRoutes.get("/audit", async (context) => {
  const logs = await listTenantAuditLogs(context.get("db"), context.get("tenantId"));

  return context.json(ok(logs));
});

analyticsRoutes.get("/feedback", async (context) => {
  const items = await listTenantFeedbackItems(
    context.get("db"),
    context.get("tenantId")
  );
  const summary = items.reduce(
    (current, item) => ({
      down: current.down + (item.rating === "down" ? 1 : 0),
      up: current.up + (item.rating === "up" ? 1 : 0)
    }),
    { down: 0, up: 0 }
  );

  return context.json(
    ok({
      recentNegative: items.filter((item) => item.rating === "down").slice(0, 5),
      summary
    })
  );
});

analyticsRoutes.get("/shard", (context) =>
  context.json(
    ok({
      bucket: context.get("shardBucket"),
      shardKey: context.get("shardKey"),
      tenantId: context.get("tenantId")
    })
  )
);

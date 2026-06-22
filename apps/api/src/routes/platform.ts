import {
  countTenantActiveDocuments,
  findTenantById,
  listAbuseReviews,
  listPlatformAuditLogs,
  listTenantFeatureFlags,
  listTenantMembers,
  listTenants,
  recordAuditLog,
  sumTenantUsageSince,
  updateAbuseReviewStatus,
  updateTenantPlanAndLimits,
  updateTenantStatus,
  upsertTenantFeatureFlag
} from "@rag-llm/db";
import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import { notFound } from "../lib/api-error";
import { requireTenantRole } from "../lib/auth";
import type { ApiContext } from "../lib/context";
import { ok, parseJsonBody } from "../lib/http";
import { getPlanLimits } from "../services/plan-limits";

const planSchema = z.object({ plan: z.enum(["starter", "pro", "enterprise"]) });
const statusSchema = z.object({ status: z.enum(["active", "trialing", "suspended"]) });
const flagSchema = z.object({
  enabled: z.boolean(),
  key: z.string().min(2).regex(/^[a-z0-9_:-]+$/),
  rolloutPercentage: z.number().int().min(0).max(100)
});
const reviewStatusSchema = z.object({
  status: z.enum(["dismissed", "open", "resolved"])
});

export const platformRoutes = new Hono<ApiContext>();

platformRoutes.use("*", requireTenantRole(["platform_admin"]));

platformRoutes.get("/tenants", async (context) => {
  const q = context.req.query("q")?.toLowerCase().trim();
  const tenants = (await listTenants(context.get("db"))).filter((tenant) =>
    q ? `${tenant.name} ${tenant.slug}`.toLowerCase().includes(q) : true
  );

  const rows = await Promise.all(
    tenants.map(async (tenant) => {
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const [documents, members, queriesThisMonth, flags] = await Promise.all([
        countTenantActiveDocuments(context.get("db"), tenant.id),
        listTenantMembers(context.get("db"), tenant.id),
        sumTenantUsageSince(context.get("db"), tenant.id, "query", monthStart),
        listTenantFeatureFlags(context.get("db"), tenant.id)
      ]);

      return { documents, flags, members: members.length, queriesThisMonth, tenant };
    })
  );

  return context.json(ok(rows));
});

platformRoutes.patch("/tenants/:tenantId/plan", async (context) => {
  const body = await parseJsonBody(context, planSchema);
  const tenantId = context.req.param("tenantId");
  const limits = getPlanLimits(body.plan);
  const tenant = await updateTenantPlanAndLimits(context.get("db"), tenantId, {
    ...limits,
    plan: body.plan
  });

  await recordPlatformAudit(context, "platform.tenant_plan_changed", tenantId, {
    plan: body.plan
  });

  return context.json(ok(tenant));
});

platformRoutes.patch("/tenants/:tenantId/status", async (context) => {
  const body = await parseJsonBody(context, statusSchema);
  const tenantId = context.req.param("tenantId");
  const tenant = await updateTenantStatus(context.get("db"), tenantId, body.status);

  await recordPlatformAudit(context, "platform.tenant_status_changed", tenantId, {
    status: body.status
  });

  return context.json(ok(tenant));
});

platformRoutes.get("/tenants/:tenantId/flags", async (context) => {
  const tenantId = context.req.param("tenantId");
  const tenant = await findTenantById(context.get("db"), tenantId);

  if (!tenant) {
    throw notFound("Tenant not found");
  }

  return context.json(ok(await listTenantFeatureFlags(context.get("db"), tenantId)));
});

platformRoutes.put("/tenants/:tenantId/flags", async (context) => {
  const body = await parseJsonBody(context, flagSchema);
  const tenantId = context.req.param("tenantId");
  const flag = await upsertTenantFeatureFlag(context.get("db"), {
    ...body,
    tenantId
  });

  await recordPlatformAudit(context, "platform.feature_flag_changed", tenantId, {
    enabled: body.enabled,
    key: body.key,
    rolloutPercentage: body.rolloutPercentage
  });

  return context.json(ok(flag));
});

platformRoutes.get("/abuse-reviews", async (context) =>
  context.json(ok(await listAbuseReviews(context.get("db"))))
);

platformRoutes.patch("/abuse-reviews/:reviewId", async (context) => {
  const body = await parseJsonBody(context, reviewStatusSchema);
  const review = await updateAbuseReviewStatus(
    context.get("db"),
    context.req.param("reviewId"),
    body.status
  );

  await recordPlatformAudit(context, "platform.abuse_review_updated", review.id, {
    status: body.status
  });

  return context.json(ok(review));
});

platformRoutes.get("/audit", async (context) =>
  context.json(ok(await listPlatformAuditLogs(context.get("db"))))
);

const recordPlatformAudit = (
  context: Context<ApiContext>,
  action: string,
  targetId: string,
  metadata: Record<string, string | number | boolean>
) =>
  recordAuditLog(context.get("db"), {
    action,
    actorUserId: context.get("userId"),
    metadata,
    targetId,
    targetType: "platform",
    tenantId: context.get("tenantId")
  });

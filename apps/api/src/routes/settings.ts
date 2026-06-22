import {
  findTenantBranding,
  findTenantById,
  findTenantSettings,
  listTenantAuditLogs,
  listTenantDocuments,
  listTenantMembers,
  listTenantUsageEvents,
  recordAuditLog,
  upsertTenantSettings
} from "@rag-llm/db";
import { Hono } from "hono";
import { z } from "zod";
import { badRequest, notFound } from "../lib/api-error";
import { requireTenantRole } from "../lib/auth";
import type { ApiContext } from "../lib/context";
import { ok, parseJsonBody } from "../lib/http";
import { deleteTenantAndPrivateData } from "../services/tenant-deletion";

const settingsSchema = z.object({
  allowAnswerExport: z.boolean(),
  allowSourceDownload: z.boolean(),
  dataRetentionDays: z.number().int().min(30).max(3650),
  requireCitations: z.boolean()
});
const deleteTenantSchema = z.object({
  confirmation: z.string().min(1)
});

export const settingsRoutes = new Hono<ApiContext>();

settingsRoutes.use("*", requireTenantRole(["admin"]));

settingsRoutes.get("/current", async (context) => {
  const settings = await findTenantSettings(
    context.get("db"),
    context.get("tenantId")
  );

  return context.json(ok(settings));
});

settingsRoutes.put("/current", async (context) => {
  const body = await parseJsonBody(context, settingsSchema);
  const tenantId = context.get("tenantId");
  const settings = await upsertTenantSettings(context.get("db"), {
    ...body,
    tenantId
  });

  await recordAuditLog(context.get("db"), {
    action: "tenant_settings.updated",
    actorUserId: context.get("userId"),
    metadata: {
      dataRetentionDays: settings.dataRetentionDays,
      requireCitations: settings.requireCitations
    },
    targetId: tenantId,
    targetType: "tenant_settings",
    tenantId
  });

  return context.json(ok(settings));
});

settingsRoutes.get("/current/export", async (context) => {
  const db = context.get("db");
  const tenantId = context.get("tenantId");
  const tenant = await findTenantById(db, tenantId);

  if (!tenant) {
    throw notFound("Tenant not found");
  }

  const [settings, branding, documents, members, usageEvents, auditLogs] =
    await Promise.all([
      findTenantSettings(db, tenantId),
      findTenantBranding(db, tenantId),
      listTenantDocuments(db, tenantId),
      listTenantMembers(db, tenantId),
      listTenantUsageEvents(db, tenantId),
      listTenantAuditLogs(db, tenantId)
    ]);

  await recordAuditLog(db, {
    action: "tenant_data.exported",
    actorUserId: context.get("userId"),
    metadata: { format: "json" },
    targetId: tenantId,
    targetType: "tenant",
    tenantId
  });

  return context.json(
    ok({
      auditLogs,
      branding,
      documents,
      exportedAt: new Date().toISOString(),
      members,
      settings,
      tenant,
      usageEvents
    })
  );
});

settingsRoutes.delete("/current", async (context) => {
  const body = await parseJsonBody(context, deleteTenantSchema);
  const db = context.get("db");
  const tenantId = context.get("tenantId");
  const tenant = await findTenantById(db, tenantId);

  if (!tenant) {
    throw notFound("Tenant not found");
  }

  if (body.confirmation !== tenant.slug) {
    throw badRequest("Tenant confirmation did not match");
  }

  const result = await deleteTenantAndPrivateData({
    actorUserId: context.get("userId"),
    db,
    env: context.get("env"),
    tenantId
  });

  return context.json(
    ok({
      deletedObjects: result.deletedObjects,
      tenantId: result.tenant.id
    })
  );
});

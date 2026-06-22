import { findTenantBranding, findTenantById, findTenantSettings } from "@rag-llm/db";
import { Hono } from "hono";
import { requireTenantRole } from "../lib/auth";
import { notFound } from "../lib/api-error";
import type { ApiContext } from "../lib/context";
import { ok } from "../lib/http";

export const portalRoutes = new Hono<ApiContext>();

portalRoutes.use("*", requireTenantRole(["admin", "editor", "end_user"]));

portalRoutes.get("/current", async (context) => {
  const tenantId = context.get("tenantId");
  const db = context.get("db");
  const [tenant, branding, settings] = await Promise.all([
    findTenantById(db, tenantId),
    findTenantBranding(db, tenantId),
    findTenantSettings(db, tenantId)
  ]);

  if (!tenant) {
    throw notFound("Tenant not found");
  }

  return context.json(
    ok({
      branding: branding ?? {
        accentColor: "#3b82f6",
        logoObjectKey: null,
        portalName: `${tenant.name} Assistant`,
        primaryColor: "#0f172a",
        tenantId,
        welcomeMessage: `Ask a question about ${tenant.name}'s documents.`
      },
      settings,
      tenant
    })
  );
});

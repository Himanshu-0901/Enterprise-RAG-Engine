import { findTenantCitation, findTenantSettings } from "@rag-llm/db";
import { Hono } from "hono";
import { requireTenantRole } from "../lib/auth";
import { notFound } from "../lib/api-error";
import type { ApiContext } from "../lib/context";
import { ok } from "../lib/http";
import { readTextObject } from "../services/object-storage";

export const viewerRoutes = new Hono<ApiContext>();

viewerRoutes.use("*", requireTenantRole(["admin", "editor", "end_user"]));

viewerRoutes.get("/citations/:citationId", async (context) => {
  const db = context.get("db");
  const tenantId = context.get("tenantId");
  const [citation, settings] = await Promise.all([
    findTenantCitation(db, tenantId, context.req.param("citationId")),
    findTenantSettings(db, tenantId)
  ]);

  if (!citation) {
    throw notFound("Citation not found");
  }

  const canOpenSource = settings.allowSourceDownload;
  const content = canOpenSource
    ? await readTextObject(context.get("env"), citation.documentStorageKey)
    : null;

  return context.json(
    ok({
      canOpenSource,
      citation,
      content,
      fileName: citation.documentName
    })
  );
});

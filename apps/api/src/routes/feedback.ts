import { upsertMessageFeedback } from "@rag-llm/db";
import { Hono } from "hono";
import { z } from "zod";
import { notFound } from "../lib/api-error";
import { requireTenantRole } from "../lib/auth";
import type { ApiContext } from "../lib/context";
import { ok, parseJsonBody } from "../lib/http";
import { recordMessageFeedback } from "../services/activity";

const feedbackSchema = z.object({
  comment: z.string().max(1000).optional(),
  messageId: z.string().uuid(),
  rating: z.enum(["up", "down"])
});

export const feedbackRoutes = new Hono<ApiContext>();

feedbackRoutes.use("*", requireTenantRole(["admin", "editor", "end_user"]));

feedbackRoutes.post("/", async (context) => {
  const body = await parseJsonBody(context, feedbackSchema);
  const feedback = await upsertMessageFeedback(context.get("db"), {
    comment: body.comment?.trim() || null,
    messageId: body.messageId,
    rating: body.rating,
    tenantId: context.get("tenantId"),
    userId: context.get("userId")
  });

  if (!feedback) {
    throw notFound("Assistant message not found");
  }

  await recordMessageFeedback(
    context.get("db"),
    {
      actorUserId: context.get("userId"),
      tenantId: context.get("tenantId")
    },
    feedback
  );

  return context.json(ok(feedback));
});

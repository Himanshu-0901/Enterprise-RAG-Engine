import {
  findTenantCitation,
  findTenantSettings,
} from "@rag-llm/db";
import { Hono } from "hono";
import { z } from "zod";
import { forbidden, notFound } from "../lib/api-error";
import { requireTenantRole } from "../lib/auth";
import type { ApiContext } from "../lib/context";
import { ok, parseJsonBody } from "../lib/http";
import { recordCitationClicked } from "../services/activity";
import { answerChatQuestion } from "../services/chat-orchestration";
import { readTextObject } from "../services/object-storage";
import { enforceMonthlyQueryQuota } from "../services/quota";

const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  question: z.string().min(1)
});

export const chatRoutes = new Hono<ApiContext>();

chatRoutes.use("*", requireTenantRole(["admin", "editor", "end_user"]));

chatRoutes.post("/citations/:citationId/click", async (context) => {
  const citation = await findTenantCitation(
    context.get("db"),
    context.get("tenantId"),
    context.req.param("citationId")
  );

  if (!citation) {
    throw notFound("Citation not found");
  }

  await recordCitationClicked(
    context.get("db"),
    {
      actorUserId: context.get("userId"),
      tenantId: context.get("tenantId")
    },
    citation
  );

  return context.json(ok(citation));
});

chatRoutes.get("/citations/:citationId/source", async (context) => {
  const db = context.get("db");
  const tenantId = context.get("tenantId");
  const [citation, settings] = await Promise.all([
    findTenantCitation(db, tenantId, context.req.param("citationId")),
    findTenantSettings(db, tenantId)
  ]);

  if (!citation) {
    throw notFound("Citation not found");
  }

  if (!settings.allowSourceDownload) {
    throw forbidden("Source downloads are disabled for this tenant");
  }

  const content = await readTextObject(context.get("env"), citation.documentStorageKey);

  return context.json(
    ok({
      citation,
      content,
      fileName: citation.documentName
    })
  );
});

chatRoutes.post("/", async (context) => {
  const body = await parseJsonBody(context, chatSchema);
  const tenantId = context.get("tenantId");
  const userId = context.get("userId");
  const db = context.get("db");
  await enforceMonthlyQueryQuota(db, tenantId);
  const answer = await answerChatQuestion({
    conversationId: body.conversationId,
    db,
    embeddingProvider: context.get("embeddingProvider"),
    llmProvider: context.get("llmProvider"),
    question: body.question,
    tenantId,
    userId
  });

  return context.json(ok(answer));
});

chatRoutes.post("/stream", async (context) => {
  const body = await parseJsonBody(context, chatSchema);
  const tenantId = context.get("tenantId");
  const userId = context.get("userId");
  const db = context.get("db");
  await enforceMonthlyQueryQuota(db, tenantId);
  const answer = await answerChatQuestion({
    conversationId: body.conversationId,
    db,
    embeddingProvider: context.get("embeddingProvider"),
    llmProvider: context.get("llmProvider"),
    question: body.question,
    tenantId,
    userId
  });

  return streamJson(answer);
});

const streamJson = (payload: unknown): Response =>
  new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`event: message\n`));
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(ok(payload))}\n\n`)
        );
        controller.enqueue(new TextEncoder().encode(`event: done\ndata: {}\n\n`));
        controller.close();
      }
    }),
    {
      headers: {
        "cache-control": "no-cache",
        "content-type": "text/event-stream"
      }
    }
  );

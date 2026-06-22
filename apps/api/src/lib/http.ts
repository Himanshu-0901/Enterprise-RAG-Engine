import type { Context } from "hono";
import type { ZodSchema } from "zod";
import { badRequest } from "./api-error";

export const parseJsonBody = async <T>(
  context: Context,
  schema: ZodSchema<T>
): Promise<T> => {
  const body = await context.req.json().catch(() => {
    throw badRequest("Request body must be valid JSON");
  });

  const result = schema.safeParse(body);

  if (!result.success) {
    throw badRequest(result.error.issues[0]?.message ?? "Invalid request body");
  }

  return result.data;
};

export const ok = <T>(data: T) => ({ data });

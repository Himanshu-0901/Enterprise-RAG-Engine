import { HTTPException } from "hono/http-exception";

export type ApiErrorCode =
  | "bad_request"
  | "forbidden"
  | "limit_exceeded"
  | "not_found"
  | "unauthorized"
  | "internal_error";

export class ApiError extends HTTPException {
  readonly code: ApiErrorCode;

  constructor(
    status: 400 | 401 | 403 | 404 | 429 | 500,
    code: ApiErrorCode,
    message: string
  ) {
    super(status, { message });
    this.code = code;
  }
}

export const badRequest = (message: string): ApiError =>
  new ApiError(400, "bad_request", message);

export const forbidden = (message: string): ApiError =>
  new ApiError(403, "forbidden", message);

export const limitExceeded = (message: string): ApiError =>
  new ApiError(429, "limit_exceeded", message);

export const notFound = (message: string): ApiError =>
  new ApiError(404, "not_found", message);

export const unauthorized = (message: string): ApiError =>
  new ApiError(401, "unauthorized", message);

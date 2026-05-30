/**
 * Application error with an HTTP status code. Anything thrown that is NOT an
 * HttpError is treated as an internal error by the global handler and the
 * underlying message is NOT exposed to the client.
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = "HttpError";
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new HttpError(400, "badRequest", msg, details);

export const notFound = (msg = "Not found") =>
  new HttpError(404, "notFound", msg);

export const upstreamError = (status: number, msg: string, details?: unknown) =>
  new HttpError(status, "upstreamError", msg, details);

export const upstreamUnavailable = (msg = "Upstream service unavailable") =>
  new HttpError(502, "upstreamUnavailable", msg);

export const upstreamTimeout = (msg = "Upstream request timed out") =>
  new HttpError(504, "upstreamTimeout", msg);

/**
 * Thin typed fetch client to the local proxy.
 *
 * Base URL resolution order:
 *  1. `import.meta.env.VITE_PROXY_URL` if set (prod / preview)
 *  2. Same-origin "/api" — which Vite's dev server rewrites to the proxy
 */
const BASE = (import.meta.env.VITE_PROXY_URL as string | undefined) ?? "/api";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;
  constructor(status: number, body: ApiErrorBody["error"]) {
    super(body.message || `Request failed with ${status}`);
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    });
  } catch (err) {
    throw new ApiError(0, {
      code: "network",
      message:
        err instanceof Error ? err.message : "Impossible de joindre le proxy.",
    });
  }
  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      /* ignore non-JSON error */
    }
    throw new ApiError(res.status, {
      code: body?.error?.code ?? "httpError",
      message:
        body?.error?.message ?? `Erreur ${res.status} lors de la requête.`,
      details: body?.error?.details,
    });
  }
  return (await res.json()) as T;
}

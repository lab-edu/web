import type { ApiEnvelope } from "./types";

const API_BASE = "/core/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: number;

  constructor(message: string, status: number, code?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type RequestInitWithJson = RequestInit & {
  body?: BodyInit | null;
};

function isFormData(body: BodyInit | null | undefined): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

export async function apiRequest<T>(path: string, init: RequestInitWithJson = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !isFormData(init.body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? ((await response.json()) as ApiEnvelope<T>) : null;

  if (!response.ok) {
    throw new ApiError(payload?.message ?? `HTTP ${response.status}`, response.status, payload?.code);
  }

  if (!payload) {
    return null as T;
  }

  if (payload.code !== 0) {
    throw new ApiError(payload.message || "请求失败", response.status, payload.code);
  }

  return payload.data;
}

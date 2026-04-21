import type { ApiEnvelope } from "./types";

const DEFAULT_CORE_BASE_URL = "http://localhost:8080";

function inferCoreBaseUrlFromLocation() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const { protocol, hostname } = window.location;
  if (!hostname) {
    return undefined;
  }

  return `${protocol}//${hostname}:8080`;
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function resolveCoreBaseUrl() {
  const inferredBase = inferCoreBaseUrlFromLocation();
  const configuredBase =
    process.env.NEXT_PUBLIC_CORE_BASE_URL
    ?? process.env.CORE_BASE_URL
    ?? inferredBase
    ?? DEFAULT_CORE_BASE_URL;

  return normalizeBaseUrl(configuredBase);
}

const API_BASE = `${resolveCoreBaseUrl()}/api/v1`;

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

  // 调试日志：记录 API 路径与返回负载（仅用于开发）
  try {
    console.debug("[apiRequest]", path, init.method ?? "GET", payload);
  } catch {
    // ignore
  }

  if (!response.ok) {
    console.error('API request failed:', response.status, response.statusText, payload, path);
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

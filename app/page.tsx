"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  status?: string;
  [key: string]: unknown;
};

const healthEndpoint = "/core/actuator/health";

function formatUpdatedAt() {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: false,
  }).format(new Date());
}

export default function Home() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const loadHealth = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(healthEndpoint, {
        signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as HealthResponse;
      setData(payload);
      setUpdatedAt(formatUpdatedAt());
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return;
      }

      setData(null);
      setUpdatedAt(null);
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    void loadHealth(controller.signal);

    return () => controller.abort();
  }, []);

  const status = data?.status ?? (error ? "DOWN" : "UNKNOWN");
  const isUp = status === "UP";
  const isErrored = Boolean(error);

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-6 py-8 text-slate-900 sm:px-8 lg:px-12">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_55%)]" />
      <div className="absolute left-1/2 top-12 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-6">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              lab-edu web
            </div>

            <div className="mt-6 space-y-5">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                core 健康状态面板
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                页面会通过同源入口请求 <span className="font-mono text-slate-900">/core/actuator/health</span>，把 core 的 Actuator 结果直接展示出来，方便在 nginx、web 和 core 之间快速确认链路是否正常。
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-4 py-2">Next.js App Router</span>
              <span className="rounded-full bg-slate-100 px-4 py-2">core /actuator/health</span>
              <span className="rounded-full bg-slate-100 px-4 py-2">nginx same-origin proxy</span>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-7 text-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Live status
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  {isLoading ? "正在请求 core" : isErrored ? "请求失败" : "请求成功"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void loadHealth()}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                刷新
              </button>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div
                className={`h-4 w-4 rounded-full ${
                  isLoading ? "bg-amber-400" : isUp ? "bg-emerald-400" : "bg-rose-400"
                }`}
              />
              <div>
                <p className="text-sm text-slate-400">当前状态</p>
                <p className="text-3xl font-semibold tracking-tight">{status}</p>
              </div>
            </div>

            <dl className="mt-8 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="text-slate-400">请求目标</dt>
                <dd className="mt-2 font-mono text-white">{healthEndpoint}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="text-slate-400">最后更新</dt>
                <dd className="mt-2 text-white">{updatedAt ?? "-"}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                core response
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                Actuator 返回内容
              </h2>
            </div>

            {error ? (
              <p className="rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                {error}
              </p>
            ) : null}
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl bg-slate-950 p-5 text-slate-50 shadow-inner">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-3 w-2/5 animate-pulse rounded-full bg-white/10" />
                <div className="h-3 w-3/5 animate-pulse rounded-full bg-white/10" />
                <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
              </div>
            ) : error ? (
              <p className="text-sm leading-7 text-rose-200">
                无法读取 core 的健康检查结果。请确认 core 已启动，并且 nginx 已把 <span className="font-mono">/core/actuator/health</span> 正确转发到后端。
              </p>
            ) : (
              <pre className="overflow-x-auto text-sm leading-7 text-slate-100">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

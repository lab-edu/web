"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

const coreDocsUrl = process.env.NEXT_PUBLIC_CORE_DOCS_URL ?? "http://localhost:8080/swagger-ui.html";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/courses");
    }
  }, [loading, user, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ identifier, password });
      router.replace("/courses");
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
      } else {
        setError("登录失败，请稍后重试");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-wrap flex min-h-screen items-center justify-center">
      <section className="panel w-full max-w-md">
        <div className="panel-inner space-y-6 p-8">
          <div className="space-y-2">
            <p className="mono text-xs font-bold uppercase tracking-[0.24em] text-teal-700">lab-edu</p>
            <h1 className="text-3xl font-bold text-[var(--ink)]">登录教学平台</h1>
            <p className="muted text-sm">登录后可进入课程、实验与提交闭环。</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="identifier">
                用户名或邮箱
              </label>
              <input
                id="identifier"
                className="field"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="password">
                密码
              </label>
              <input
                id="password"
                className="field"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <button className="btn btn-primary w-full" type="submit" disabled={submitting}>
              {submitting ? "登录中..." : "登录"}
            </button>
          </form>

          <p className="muted text-xs">
            当前 MVP 通过后端 HttpOnly Cookie 维持登录态，刷新页面后会自动恢复。
          </p>
          <p className="muted text-xs">
            还没有账号？
            {" "}
            <Link className="text-teal-700 underline" href="/register">
              去注册
            </Link>
            。
          </p>
          <p className="muted text-xs">
            API 文档见
            {" "}
            <Link className="text-teal-700 underline" href={coreDocsUrl} target="_blank">
              Swagger UI
            </Link>
            。
          </p>
        </div>
      </section>
    </main>
  );
}

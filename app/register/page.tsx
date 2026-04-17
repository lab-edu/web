"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/lib/api/types";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/courses");
    }
  }, [loading, user, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
        role,
      });

      setSuccess("注册成功，请使用新账号登录。");
      router.push("/login");
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
      } else {
        setError("注册失败，请稍后重试");
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
            <h1 className="text-3xl font-bold text-[var(--ink)]">注册账号</h1>
            <p className="muted text-sm">创建账号后即可进入课程与实验平台。</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="username">
                用户名
              </label>
              <input
                id="username"
                className="field"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                minLength={3}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="displayName">
                显示名（可选）
              </label>
              <input
                id="displayName"
                className="field"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="nickname"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="email">
                邮箱
              </label>
              <input
                id="email"
                className="field"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
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
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="role">
                身份
              </label>
              <select
                id="role"
                className="field"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
              >
                <option value="STUDENT">学生</option>
                <option value="TEACHER">教师</option>
              </select>
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}

            <button className="btn btn-primary w-full" type="submit" disabled={submitting}>
              {submitting ? "注册中..." : "注册"}
            </button>
          </form>

          <p className="muted text-xs">
            已有账号？
            {" "}
            <Link className="text-teal-700 underline" href="/login">
              去登录
            </Link>
            。
          </p>
        </div>
      </section>
    </main>
  );
}

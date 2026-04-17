"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { coursesApi } from "@/lib/api/courses";
import type { CourseSummary } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

export default function CoursesPage() {
  const { user, loading, logout } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const isTeacher = user?.role === "TEACHER";
  const heading = useMemo(() => {
    if (!user) {
      return "课程中心";
    }
    return isTeacher ? "我负责的课程" : "我参与的课程";
  }, [user, isTeacher]);

  const loadCourses = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await coursesApi.list();
      setCourses(data.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载课程失败");
      setCourses([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      void loadCourses();
    }
  }, [loading, user]);

  const onCreateCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await coursesApi.create({ title: createTitle, description: createDescription });
      setCreateTitle("");
      setCreateDescription("");
      await loadCourses();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建课程失败");
    }
  };

  const onJoinCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await coursesApi.join(inviteCode.trim());
      setInviteCode("");
      await loadCourses();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "加入课程失败");
    }
  };

  const onLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  if (loading || !user) {
    return (
      <main className="page-wrap">
        <p className="muted">正在同步登录状态...</p>
      </main>
    );
  }

  return (
    <main className="page-wrap space-y-5">
      <section className="panel">
        <div className="panel-inner flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mono text-xs font-bold uppercase tracking-[0.24em] text-teal-700">dashboard</p>
            <h1 className="mt-1 text-3xl font-bold">{heading}</h1>
            <p className="muted mt-2 text-sm">
              当前用户：{user.displayName || user.username}（{user.role}）
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {isTeacher ? (
          <article className="panel">
            <form className="panel-inner space-y-3" onSubmit={onCreateCourse}>
              <h2 className="text-xl font-semibold">创建课程</h2>
              <input
                className="field"
                placeholder="课程名称"
                value={createTitle}
                onChange={(event) => setCreateTitle(event.target.value)}
                required
              />
              <textarea
                className="field min-h-24"
                placeholder="课程描述（可选）"
                value={createDescription}
                onChange={(event) => setCreateDescription(event.target.value)}
              />
              <button className="btn btn-primary" type="submit">
                发布课程
              </button>
            </form>
          </article>
        ) : (
          <article className="panel">
            <form className="panel-inner space-y-3" onSubmit={onJoinCourse}>
              <h2 className="text-xl font-semibold">加入课程</h2>
              <input
                className="field mono"
                placeholder="输入邀请码"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                required
              />
              <button className="btn btn-primary" type="submit">
                加入
              </button>
            </form>
          </article>
        )}

        <article className="panel">
          <div className="panel-inner space-y-2">
            <h2 className="text-xl font-semibold">联调说明</h2>
            <p className="muted text-sm">页面调用统一使用 services 层封装，自动附带 Cookie，并统一处理后端 code/message/data 响应结构。</p>
            <p className="muted text-sm">登录态失效后访问课程页会被中间件重定向到 /login。</p>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-inner space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">课程列表</h2>
            <button className="btn btn-secondary" type="button" onClick={() => void loadCourses()}>
              刷新
            </button>
          </div>

          {busy ? <p className="muted text-sm">加载中...</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          {!busy && courses.length === 0 ? (
            <p className="muted text-sm">当前暂无课程。</p>
          ) : (
            <ul className="grid gap-3">
              {courses.map((course) => (
                <li key={course.id} className="rounded-xl border border-[var(--border)] bg-white/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{course.title}</h3>
                      <p className="muted mt-1 text-sm">{course.description || "暂无描述"}</p>
                    </div>
                    <Link className="btn btn-primary" href={`/courses/${course.id}`}>
                      进入课程
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <span className="rounded-md bg-stone-100 px-2 py-1">成员 {course.memberCount}</span>
                    <span className="rounded-md bg-stone-100 px-2 py-1 mono">邀请码 {course.inviteCode}</span>
                    <span className="rounded-md bg-stone-100 px-2 py-1">教师 {course.ownerUsername}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

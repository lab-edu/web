"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { coursesApi } from "@/lib/api/courses";
import { experimentsApi } from "@/lib/api/experiments";
import type { CourseDetail } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { user, loading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");

  const loadCourse = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const detail = await coursesApi.detail(courseId);
      setCourse(detail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载课程详情失败");
      setCourse(null);
    } finally {
      setBusy(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!loading && user) {
      void loadCourse();
    }
  }, [loading, user, loadCourse]);

  const onCreateExperiment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await experimentsApi.create(courseId, {
        title,
        description,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      });
      setTitle("");
      setDescription("");
      setDueAt("");
      await loadCourse();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "发布实验失败");
    }
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
        <div className="panel-inner flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link className="muted text-sm underline" href="/courses">
              返回课程列表
            </Link>
            <h1 className="mt-1 text-3xl font-bold">{course?.title || "课程详情"}</h1>
            <p className="muted mt-2 text-sm">{course?.description || "暂无描述"}</p>
          </div>
          {course ? <span className="mono rounded-md bg-stone-100 px-2 py-1 text-xs">邀请码 {course.inviteCode}</span> : null}
        </div>
      </section>

      {error ? (
        <section className="panel">
          <p className="panel-inner text-sm text-red-700">{error}</p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="panel">
          <div className="panel-inner space-y-3">
            <h2 className="text-xl font-semibold">课程成员</h2>
            {busy ? <p className="muted text-sm">加载中...</p> : null}
            <ul className="space-y-2">
              {course?.members.map((member) => (
                <li key={member.user.id} className="rounded-lg border border-[var(--border)] bg-white/70 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span>{member.user.displayName || member.user.username}</span>
                    <span className="mono text-xs text-teal-700">{member.memberRole}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="panel">
          <div className="panel-inner space-y-3">
            <h2 className="text-xl font-semibold">实验列表</h2>
            <ul className="space-y-2">
              {course?.experiments.map((experiment) => (
                <li key={experiment.id} className="rounded-lg border border-[var(--border)] bg-white/70 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{experiment.title}</p>
                      <p className="muted text-xs">截止：{experiment.dueAt ? new Date(experiment.dueAt).toLocaleString("zh-CN") : "未设置"}</p>
                    </div>
                    <Link className="btn btn-primary" href={`/experiments/${experiment.id}?courseId=${courseId}`}>
                      查看
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      {user.role === "TEACHER" ? (
        <section className="panel">
          <form className="panel-inner grid gap-3 md:grid-cols-2" onSubmit={onCreateExperiment}>
            <div className="space-y-2 md:col-span-2">
              <h2 className="text-xl font-semibold">发布实验</h2>
            </div>
            <input
              className="field md:col-span-2"
              placeholder="实验标题"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <textarea
              className="field md:col-span-2 min-h-24"
              placeholder="实验描述"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <input
              className="field"
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              发布实验
            </button>
          </form>
        </section>
      ) : null}
    </main>
  );
}

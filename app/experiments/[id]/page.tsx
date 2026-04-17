"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { experimentsApi } from "@/lib/api/experiments";
import { submissionsApi } from "@/lib/api/submissions";
import type { ExperimentDetail, SubmissionDetail } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

export default function ExperimentDetailPage() {
  const params = useParams<{ id: string }>();
  const experimentId = params.id;
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") ?? "";

  const { user, loading } = useAuth();

  const [experiment, setExperiment] = useState<ExperimentDetail | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDetail[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!courseId) {
      setError("缺少 courseId 参数，请从课程详情页进入实验。");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const [experimentData, submissionsData] = await Promise.all([
        experimentsApi.detail(courseId, experimentId),
        submissionsApi.list(experimentId),
      ]);
      setExperiment(experimentData);
      setSubmissions(submissionsData.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载实验数据失败");
      setExperiment(null);
      setSubmissions([]);
    } finally {
      setBusy(false);
    }
  }, [courseId, experimentId]);

  useEffect(() => {
    if (!loading && user) {
      void loadData();
    }
  }, [loading, user, loadData]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("请选择要上传的文件");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submissionsApi.create(experimentId, {
        file,
        note,
      });
      setFile(null);
      setNote("");
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败");
    } finally {
      setSubmitting(false);
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
        <div className="panel-inner space-y-2">
          <Link className="muted text-sm underline" href={courseId ? `/courses/${courseId}` : "/courses"}>
            返回课程详情
          </Link>
          <h1 className="text-3xl font-bold">{experiment?.title || "实验详情"}</h1>
          <p className="muted text-sm">{experiment?.description || "暂无描述"}</p>
          <p className="muted text-sm">截止时间：{experiment?.dueAt ? new Date(experiment.dueAt).toLocaleString("zh-CN") : "未设置"}</p>
        </div>
      </section>

      {user.role === "STUDENT" ? (
        <section className="panel">
          <form className="panel-inner grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
            <h2 className="text-xl font-semibold md:col-span-2">上传实验提交</h2>
            <input
              className="field md:col-span-2"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
            <textarea
              className="field md:col-span-2 min-h-24"
              placeholder="备注（可选）"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "提交中..." : "提交实验"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-inner space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">提交记录</h2>
            <button className="btn btn-secondary" type="button" onClick={() => void loadData()}>
              刷新
            </button>
          </div>

          {busy ? <p className="muted text-sm">加载中...</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          {!busy && submissions.length === 0 ? (
            <p className="muted text-sm">暂无提交记录。</p>
          ) : (
            <ul className="space-y-2">
              {submissions.map((submission) => (
                <li key={submission.id} className="rounded-lg border border-[var(--border)] bg-white/75 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{submission.fileName}</p>
                    <span className="muted text-xs">{new Date(submission.submittedAt).toLocaleString("zh-CN")}</span>
                  </div>
                  <p className="muted mt-1 text-xs">提交人：{submission.submittedBy.displayName || submission.submittedBy.username}</p>
                  {submission.note ? <p className="mt-2 text-xs">备注：{submission.note}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {submission.latest ? <span className="rounded-md bg-emerald-100 px-2 py-1 text-emerald-700">最新提交</span> : null}
                    {submission.score !== null ? <span className="rounded-md bg-stone-100 px-2 py-1">评分 {submission.score}</span> : null}
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

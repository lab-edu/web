"use client";

import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  CloudUploadOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { experimentsApi } from "@/lib/api/experiments";
import { submissionsApi } from "@/lib/api/submissions";
import { coursesApi } from "@/lib/api/courses";
import type { ExperimentDetail, SubmissionDetail, CourseDetail } from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { CourseShell } from "@/components/course-shell";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichTextRenderer } from "@/components/rich-text-renderer";
import { RefreshButton } from "@/components/refresh-button";
import { useAuth } from "@/lib/auth/auth-context";

export default function ExperimentDetailPage() {
  const params = useParams<{ id: string }>();
  const experimentId = params.id;
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") ?? "";

  const { user, loading } = useAuth();

  const [experiment, setExperiment] = useState<ExperimentDetail | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDetail[]>([]);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { score?: number; feedback?: string; loading?: boolean }>>({});

  const loadData = useCallback(async () => {
    if (!courseId) {
      setError("缺少 courseId 参数，请从课程详情页进入实验。");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const [experimentData, submissionsData, courseData] = await Promise.all([
        experimentsApi.detail(courseId, experimentId),
        submissionsApi.list(experimentId),
        coursesApi.detail(courseId),
      ]);
      setExperiment(experimentData);
      setSubmissions(submissionsData.items);
      setCourseDetail(courseData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载实验数据失败");
      setExperiment(null);
      setSubmissions([]);
      setCourseDetail(null);
    } finally {
      setBusy(false);
    }
  }, [courseId, experimentId]);

  useEffect(() => {
    if (!loading && user) {
      void loadData();
    }
  }, [loading, user, loadData]);

  const isTeacher = user?.role === "ADMIN" || (courseDetail?.owner.id === user?.id);
  const isStudent = user?.role !== "ADMIN" && courseDetail?.owner.id !== user?.id;

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

  const onGrade = async (submission: SubmissionDetail) => {
    const draft = gradeDrafts[submission.id] ?? {};
    if (draft.score === undefined || Number.isNaN(draft.score)) {
      setError("请先填写评分分数");
      return;
    }

    setError(null);
    setGradeDrafts((current) => ({
      ...current,
      [submission.id]: { ...draft, loading: true },
    }));

    try {
      await submissionsApi.grade(submission.id, {
        score: draft.score,
        feedback: draft.feedback,
      });
      await loadData();
    } catch (gradeError) {
      setError(gradeError instanceof Error ? gradeError.message : "评分失败");
    } finally {
      setGradeDrafts((current) => ({
        ...current,
        [submission.id]: { ...current[submission.id], loading: false },
      }));
    }
  };

  if (loading || !user) {
    return <AuthLoadingState />;
  }

  return (
    <CourseShell
      courseId={courseId || experiment?.courseId}
      title={experiment?.title || "实验详情"}
      subtitle={experiment?.description || "查看实验要求与提交进度。"}
      actions={<RefreshButton onClick={() => void loadData()} loading={busy} />}
    >
      <Card style={{ marginBottom: 16 }}>
        <Space size={18} wrap>
          <Tag color="blue">实验ID {experimentId}</Tag>
          <Typography.Text type="secondary">
            截止时间：{experiment?.dueAt ? new Date(experiment.dueAt).toLocaleString("zh-CN") : "未设置"}
          </Typography.Text>
        </Space>
      </Card>

      {isStudent ? (
        <Card title={<Space><CloudUploadOutlined />上传实验提交</Space>} style={{ marginBottom: 16 }}>
          <Form layout="vertical" onSubmitCapture={onSubmit}>
            <Form.Item label="提交文件" required>
              <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
            </Form.Item>
            <Form.Item label="备注">
              <RichTextEditor
                value={note}
                onChange={setNote}
                placeholder="可填写本次提交说明"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              提交实验
            </Button>
          </Form>
        </Card>
      ) : null}

      <Card title={<Space><HistoryOutlined />提交记录</Space>}>
        {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} /> : null}

        {busy ? (
          <Spin />
        ) : submissions.length === 0 ? (
          <Empty description="暂无提交记录" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={submissions}
            renderItem={(submission) => (
              <List.Item key={submission.id}>
                <Space orientation="vertical" size={3} style={{ width: "100%" }}>
                  <Space wrap>
                    <Typography.Text strong>{submission.fileName}</Typography.Text>
                    {submission.latest ? <Tag color="green">最新提交</Tag> : null}
                    {submission.score !== null ? <Tag color="blue">评分 {submission.score}</Tag> : <Tag>待评分</Tag>}
                  </Space>
                  <Typography.Text type="secondary">
                    提交人：{submission.submittedBy.displayName || submission.submittedBy.username}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    提交时间：{new Date(submission.submittedAt).toLocaleString("zh-CN")}
                  </Typography.Text>
                  {submission.note ? <RichTextRenderer html={submission.note} className="muted" /> : null}
                  {submission.feedback ? <RichTextRenderer html={submission.feedback} className="muted" /> : null}
                  {submission.gradedAt ? (
                    <Typography.Text type="secondary">
                      评分时间：{new Date(submission.gradedAt).toLocaleString("zh-CN")}
                    </Typography.Text>
                  ) : null}

                  {isTeacher ? (
                    <Space wrap>
                      <InputNumber
                        min={0}
                        max={100}
                        precision={2}
                        placeholder="分数"
                        value={gradeDrafts[submission.id]?.score ?? submission.score ?? undefined}
                        onChange={(value) => {
                          setGradeDrafts((current) => ({
                            ...current,
                            [submission.id]: {
                              ...current[submission.id],
                              score: typeof value === "number" ? value : undefined,
                            },
                          }));
                        }}
                      />
                      <Input
                        style={{ width: 280 }}
                        placeholder="评语（可选）"
                        value={gradeDrafts[submission.id]?.feedback ?? submission.feedback ?? ""}
                        onChange={(event) => {
                          setGradeDrafts((current) => ({
                            ...current,
                            [submission.id]: {
                              ...current[submission.id],
                              feedback: event.target.value,
                            },
                          }));
                        }}
                      />
                      <Button
                        type="primary"
                        loading={gradeDrafts[submission.id]?.loading}
                        onClick={() => void onGrade(submission)}
                      >
                        提交评分
                      </Button>
                    </Space>
                  ) : null}
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </CourseShell>
  );
}

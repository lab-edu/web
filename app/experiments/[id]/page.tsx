"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  CloudUploadOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { experimentsApi } from "@/lib/api/experiments";
import { submissionsApi } from "@/lib/api/submissions";
import type { ExperimentDetail, SubmissionDetail } from "@/lib/api/types";
import { PlatformShell } from "@/components/platform-shell";
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
      <main className="auth-page">
        <Spin size="large" tip="正在同步登录状态..." />
      </main>
    );
  }

  return (
    <PlatformShell
      title={experiment?.title || "实验详情"}
      subtitle={experiment?.description || "查看实验要求与提交进度。"}
      actions={
        <Space>
          <Link href={courseId ? `/courses/${courseId}` : "/courses"}>
            <Button>返回课程</Button>
          </Link>
          <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
            刷新
          </Button>
        </Space>
      }
    >
      <Card style={{ marginBottom: 16 }}>
        <Space size={18} wrap>
          <Tag color="blue">实验ID {experimentId}</Tag>
          <Typography.Text type="secondary">
            截止时间：{experiment?.dueAt ? new Date(experiment.dueAt).toLocaleString("zh-CN") : "未设置"}
          </Typography.Text>
        </Space>
      </Card>

      {user.role === "STUDENT" ? (
        <Card title={<Space><CloudUploadOutlined />上传实验提交</Space>} style={{ marginBottom: 16 }}>
          <Form layout="vertical" onSubmitCapture={onSubmit}>
            <Form.Item label="提交文件" required>
              <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
            </Form.Item>
            <Form.Item label="备注">
              <Input.TextArea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="可填写本次提交说明" />
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
                <Space direction="vertical" size={3} style={{ width: "100%" }}>
                  <Space wrap>
                    <Typography.Text strong>{submission.fileName}</Typography.Text>
                    {submission.latest ? <Tag color="green">最新提交</Tag> : null}
                    {submission.score !== null ? <Tag>评分 {submission.score}</Tag> : null}
                  </Space>
                  <Typography.Text type="secondary">
                    提交人：{submission.submittedBy.displayName || submission.submittedBy.username}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    提交时间：{new Date(submission.submittedAt).toLocaleString("zh-CN")}
                  </Typography.Text>
                  {submission.note ? <Typography.Text>备注：{submission.note}</Typography.Text> : null}
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </PlatformShell>
  );
}

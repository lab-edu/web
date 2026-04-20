"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarOutlined, PlusCircleOutlined, ReadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Form, Input, List, Row, Col, Space, Tag, Typography } from "antd";
import { coursesApi } from "@/lib/api/courses";
import { experimentsApi } from "@/lib/api/experiments";
import type { CourseDetail, ExperimentSummary } from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { CourseShell } from "@/components/course-shell";
import { RichTextRenderer } from "@/components/rich-text-renderer";
import { RefreshButton } from "@/components/refresh-button";
import { useAuth } from "@/lib/auth/auth-context";

export default function CourseExperimentsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const courseId = params.id;
  const { user, loading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const detail = await coursesApi.detail(courseId);
      setCourse(detail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载实验列表失败");
      setCourse(null);
    } finally {
      setBusy(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!loading && user) {
      void loadData();
    }
  }, [loading, user, loadData]);

  const onCreateExperiment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
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
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "发布实验失败");
    } finally {
      setCreating(false);
    }
  };

  if (loading || !user) {
    return <AuthLoadingState />;
  }

  const experiments = course?.experiments ?? [];
  const isTeacher = user.role === "TEACHER";
  const managementMode = isTeacher && searchParams.get("manage") === "1";

  return (
    <CourseShell title={course?.title || "实验列表"} subtitle="课程实验在这里集中查看与发布。" courseId={courseId} actions={<RefreshButton onClick={() => void loadData()} loading={busy} />}>
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">实验数量</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>{experiments.length}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">课程邀请码</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>{course?.inviteCode || "-"}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">最近实验</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>{experiments[0]?.title || "暂无"}</Typography.Title>
          </Card>
        </Col>
      </Row>


      <Card title={<Space><ReadOutlined />实验列表</Space>} loading={busy}>
        {experiments.length ? (
          <List
            itemLayout="horizontal"
            dataSource={experiments as ExperimentSummary[]}
            renderItem={(experiment) => (
              <List.Item actions={[<Link key="open" href={`/experiments/${experiment.id}?courseId=${courseId}`} target="_blank" rel="noreferrer">打开实验</Link>]}> 
                <List.Item.Meta
                  title={<Space wrap><span>{experiment.title}</span><Tag color="blue">实验</Tag></Space>}
                  description={
                    <Space direction="vertical" size={0}>
                      <RichTextRenderer html={experiment.description} emptyText="暂无描述" className="muted" />
                      <Typography.Text type="secondary"><CalendarOutlined /> 截止：{experiment.dueAt ? new Date(experiment.dueAt).toLocaleString("zh-CN") : "未设置"}</Typography.Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无实验" />
        )}
      </Card>
    </CourseShell>
  );
}

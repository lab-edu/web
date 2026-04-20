"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { BellOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Empty, Form, Input, List, Row, Space, Tag, Typography } from "antd";
import { announcementsApi } from "@/lib/api/announcements";
import { coursesApi } from "@/lib/api/courses";
import type { CourseAnnouncement, CourseDetail } from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { CourseShell } from "@/components/course-shell";
import { RefreshButton } from "@/components/refresh-button";
import { useAuth } from "@/lib/auth/auth-context";

export default function CourseNoticePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const courseId = params.id;
  const { user, loading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [announcements, setAnnouncements] = useState<CourseAnnouncement[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [detail, announcementData] = await Promise.all([
        coursesApi.detail(courseId),
        announcementsApi.list(courseId),
      ]);
      setCourse(detail);
      setAnnouncements(announcementData.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载课程通知失败");
      setCourse(null);
      setAnnouncements([]);
    } finally {
      setBusy(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!loading && user) {
      void loadData();
    }
  }, [loading, user, loadData]);

  const onCreateAnnouncement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await announcementsApi.create(courseId, { title, content });
      setTitle("");
      setContent("");
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "发布公告失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <AuthLoadingState />;
  }

  const isTeacher = user.role === "TEACHER";
  const managementMode = isTeacher && searchParams.get("manage") === "1";

  return (
    <CourseShell
      courseId={courseId}
      title={course?.title || "课程通知"}
      subtitle="默认页面展示课程通知，其他内容分别放在实验、资源、内容和管理标签页。"
      actions={<RefreshButton onClick={() => void loadData()} loading={busy} />}
    >
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">通知数量</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>{announcements.length}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">课程成员</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>{course?.members.length ?? 0}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">课程邀请码</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>{course?.inviteCode || "-"}</Typography.Title>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={16}>
          <Card title={<Space><BellOutlined />课程通知</Space>} extra={<Tag color="gold">{announcements.length}</Tag>} loading={busy}>
            {managementMode ? (
              <Form layout="vertical" onSubmitCapture={onCreateAnnouncement} style={{ marginBottom: 16 }}>
                <Form.Item label="公告标题" required>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
                </Form.Item>
                <Form.Item label="公告内容" required>
                  <Input.TextArea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={4}
                    required
                    placeholder="例如：本周实验要求、课堂提醒、材料更新"
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  发布通知
                </Button>
              </Form>
            ) : isTeacher ? (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="通知发布已归并到管理"
                description={<Link href={`/courses/${courseId}/manage`}>进入管理页发布通知</Link>}
              />
            ) : null}

            {announcements.length ? (
              <List
                dataSource={announcements}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.title}
                      description={
                        <Space direction="vertical" size={0}>
                          <Typography.Text type="secondary" style={{ whiteSpace: "pre-wrap" }}>{item.content}</Typography.Text>
                          <Typography.Text type="secondary">
                            {item.createdBy.displayName || item.createdBy.username} · {new Date(item.createdAt).toLocaleString("zh-CN")}
                          </Typography.Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无课程通知" />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="课程概览">
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Typography.Text type="secondary">{course?.description || "暂无课程简介"}</Typography.Text>
              <Space wrap>
                <Tag color="blue">实验 {course?.experiments.length ?? 0}</Tag>
                <Tag color="green">成员 {course?.members.length ?? 0}</Tag>
              </Space>
              {course?.owner ? (
                <Typography.Text type="secondary">
                  教师：{course.owner.displayName || course.owner.username}
                </Typography.Text>
              ) : null}
            </Space>
          </Card>
        </Col>
      </Row>
    </CourseShell>
  );
}

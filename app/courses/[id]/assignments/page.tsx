"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CalendarOutlined, FormOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, List, Row, Col, Space, Tag, Typography } from "antd";
import { assignmentsApi } from "@/lib/api/assignments";
import { coursesApi } from "@/lib/api/courses";
import type { AssignmentResponse, CourseDetail } from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { CourseShell } from "@/components/course-shell";
import { RichTextRenderer } from "@/components/rich-text-renderer";
import { RefreshButton } from "@/components/refresh-button";
import { useAuth } from "@/lib/auth/auth-context";

export default function CourseAssignmentsPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { user, loading } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [courseDetail, assignmentsList] = await Promise.all([
        coursesApi.detail(courseId),
        assignmentsApi.list(courseId),
      ]);
      setCourse(courseDetail);
      setAssignments(assignmentsList);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载作业列表失败");
      setCourse(null);
      setAssignments([]);
    } finally {
      setBusy(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!loading && user) {
      void loadData();
    }
  }, [loading, user, loadData]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <AuthLoadingState />;
  }

  if (!user) {
    return <AuthLoadingState message="正在跳转到登录页..." />;
  }

  const isTeacher = user.role === "ADMIN" || course?.owner.id === user.id ||
    !!course?.members?.some((m) => m.user.id === user.id && m.memberRole === "TEACHER");

  return (
    <CourseShell
      title={course?.title || "作业"}
      subtitle="课程作业在这里集中查看与提交。"
      courseId={courseId}
      actions={
        <Space>
          <RefreshButton onClick={() => void loadData()} loading={busy} />
          {isTeacher && (
            <Link href={`/courses/${courseId}/assignments/create`}>
              <Button type="primary" icon={<PlusOutlined />}>新建作业</Button>
            </Link>
          )}
        </Space>
      }
    >
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">作业数量</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>{assignments.length}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">已发布作业</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {assignments.filter(a => a.published).length}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">必做作业</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {assignments.filter(a => a.required).length}
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      <Card
        title={<Space><FormOutlined />作业列表</Space>}
        loading={busy}
        extra={
          <Space>
            <Typography.Text type="secondary">
              排序方式：<Tag color="blue">截止时间</Tag>
            </Typography.Text>
          </Space>
        }
      >
        {assignments.length ? (
          <List
            itemLayout="horizontal"
            dataSource={assignments}
            renderItem={(assignment) => {
              const totalQuestions = assignment.taskItems.length;
              const isOverdue = assignment.dueAt && new Date(assignment.dueAt) < new Date();

              return (
                <List.Item
                  actions={[
                    <Link key="view" href={`/courses/${courseId}/assignments/${assignment.id}`}>
                      {isTeacher ? "查看详情" : "开始作业"}
                    </Link>,
                    isTeacher && assignment.published && (
                      <Link key="submissions" href={`/courses/${courseId}/assignments/${assignment.id}/submissions`}>
                        查看提交
                      </Link>
                    ),
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <Space wrap>
                        <span>{assignment.title}</span>
                        {!assignment.published && <Tag color="orange">未发布</Tag>}
                        {assignment.required && <Tag color="red">必做</Tag>}
                        {isOverdue && <Tag color="error">已截止</Tag>}
                        {assignment.published && !isOverdue && <Tag color="green">进行中</Tag>}
                        <Tag>共 {totalQuestions} 题</Tag>
                        <Tag>总分: {assignment.totalScore}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <RichTextRenderer html={assignment.description} emptyText="暂无描述" className="muted" />
                        <Space>
                          {assignment.startAt && (
                            <Typography.Text type="secondary">
                              <CalendarOutlined /> 开始: {new Date(assignment.startAt).toLocaleString("zh-CN")}
                            </Typography.Text>
                          )}
                          {assignment.dueAt && (
                            <Typography.Text type={isOverdue ? "danger" : "secondary"}>
                              <CalendarOutlined /> 截止: {new Date(assignment.dueAt).toLocaleString("zh-CN")}
                            </Typography.Text>
                          )}
                          {!assignment.startAt && !assignment.dueAt && (
                            <Typography.Text type="secondary">无时间限制</Typography.Text>
                          )}
                        </Space>
                        <Typography.Text type="secondary">
                          创建者: {assignment.createdBy.displayName || assignment.createdBy.username}
                        </Typography.Text>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="暂无作业">
            {isTeacher && (
              <Link href={`/courses/${courseId}/assignments/create`}>
                <Button type="primary">创建第一个作业</Button>
              </Link>
            )}
          </Empty>
        )}
      </Card>
    </CourseShell>
  );
}
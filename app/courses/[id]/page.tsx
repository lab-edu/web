"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  BellOutlined,
  CalendarOutlined,
  NotificationOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { coursesApi } from "@/lib/api/courses";
import { experimentsApi } from "@/lib/api/experiments";
import type { CourseDetail } from "@/lib/api/types";
import { PlatformShell } from "@/components/platform-shell";
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

  const announcements = [
    {
      id: "1",
      title: "实验规范说明",
      content: "提交命名请使用 学号_姓名_实验名，报告与代码请打包后上传。",
      date: "今天 09:20",
    },
    {
      id: "2",
      title: "课堂节奏提醒",
      content: "本周完成环境验收与实验一预习，下周课堂进行现场答疑。",
      date: "昨天 16:30",
    },
  ];

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
      <main className="auth-page">
        <Spin size="large" tip="正在同步登录状态..." />
      </main>
    );
  }

  return (
    <PlatformShell
      title={course?.title || "课程详情"}
      subtitle={course?.description || "统一管理成员、公告与实验。"}
      actions={(
        <Space>
          <Button icon={<BellOutlined />} onClick={() => void loadCourse()}>
            刷新
          </Button>
          <Link href="/courses">
            <Button>返回课程列表</Button>
          </Link>
        </Space>
      )}
    >
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={17}>
          <Card title="实验列表" extra={course ? <Tag color="blue">邀请码 {course.inviteCode}</Tag> : null}>
            {busy ? (
              <Spin />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={course?.experiments || []}
                locale={{ emptyText: "暂无实验" }}
                renderItem={(experiment) => (
                  <List.Item
                    actions={[
                      <Link key={experiment.id} href={`/experiments/${experiment.id}?courseId=${courseId}`}>
                        进入实验
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      title={<Space><NotificationOutlined />{experiment.title}</Space>}
                      description={
                        <Space direction="vertical" size={0}>
                          <Typography.Text type="secondary">{experiment.description || "暂无描述"}</Typography.Text>
                          <Typography.Text type="secondary">
                            <CalendarOutlined /> 截止：{experiment.dueAt ? new Date(experiment.dueAt).toLocaleString("zh-CN") : "未设置"}
                          </Typography.Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          {user.role === "TEACHER" ? (
            <Card title="发布实验" style={{ marginTop: 16 }}>
              <Form layout="vertical" onSubmitCapture={onCreateExperiment}>
                <Form.Item label="实验标题" required>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
                </Form.Item>
                <Form.Item label="实验描述">
                  <Input.TextArea value={description} rows={4} onChange={(event) => setDescription(event.target.value)} />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} md={14}>
                    <Form.Item label="截止时间">
                      <Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={10}>
                    <Form.Item label=" " colon={false}>
                      <Button type="primary" htmlType="submit" block>
                        发布实验
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>
          ) : null}
        </Col>

        <Col xs={24} xl={7}>
          <Card title="课堂公告" extra={<Tag color="gold">{announcements.length}</Tag>}>
            <List
              dataSource={announcements}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <Space direction="vertical" size={0}>
                        <Typography.Text type="secondary">{item.content}</Typography.Text>
                        <Typography.Text type="secondary">{item.date}</Typography.Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="课程成员" style={{ marginTop: 16 }}>
            <List
              dataSource={course?.members || []}
              locale={{ emptyText: "暂无成员" }}
              renderItem={(member) => (
                <List.Item>
                  <Space>
                    <TeamOutlined />
                    <span>{member.user.displayName || member.user.username}</span>
                    <Tag>{member.memberRole}</Tag>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </PlatformShell>
  );
}

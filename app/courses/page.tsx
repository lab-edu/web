"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookOutlined,
  PlusCircleOutlined,
  TeamOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { coursesApi } from "@/lib/api/courses";
import type { CourseSummary } from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { PersonalShell } from "@/components/personal-shell";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichTextRenderer } from "@/components/rich-text-renderer";
import { RefreshButton } from "@/components/refresh-button";
import { useAuth } from "@/lib/auth/auth-context";

export default function CoursesPage() {
  const { user, loading } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // 任何认证用户都可以创建课程
  const heading = useMemo(() => {
    if (!user) {
      return "课程中心";
    }
    // 根据用户是否拥有课程来显示不同标题
    const hasOwnedCourses = courses.some(course => course.ownerId === user.id);
    return hasOwnedCourses ? "我负责的课程" : "我参与的课程";
  }, [user, courses]);

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
      setShowCreateModal(false);
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
      setShowJoinModal(false);
      await loadCourses();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "加入课程失败");
    }
  };

  if (loading || !user) {
    return <AuthLoadingState />;
  }

  return (
    <PersonalShell
      title={heading}
      subtitle="选择课程后会进入独立课程空间，不再叠加个人空间导航。"
      actions={(
        <Space>
          <RefreshButton onClick={() => void loadCourses()} loading={busy} />
          <Button type="primary" icon={<PlusCircleOutlined />} onClick={() => setShowCreateModal(true)}>
            创建课程
          </Button>
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setShowJoinModal(true)}>
            加入课程
          </Button>
        </Space>
      )}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="我的课程" value={courses.length} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="角色" value={courses.some(course => course.ownerId === user?.id) ? "教师" : "学生"} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="累计成员" value={courses.reduce((acc, item) => acc + item.memberCount, 0)} prefix={<TeamOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="课程列表" style={{ marginTop: 16 }}>
        {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

        {busy ? (
          <Spin />
        ) : courses.length === 0 ? (
          <Empty description="当前暂无课程" />
        ) : (
          <Row gutter={[16, 16]}>
            {courses.map((course) => (
              <Col xs={24} md={12} xl={8} key={course.id}>
                <Card
                  hoverable
                  title={course.title}
                  extra={<Tag color="blue">成员 {course.memberCount}</Tag>}
                  actions={[
                    <Link key="enter" href={`/courses/${course.id}`} target="_blank" rel="noreferrer">
                      打开课程空间
                    </Link>,
                  ]}
                >
                  <RichTextRenderer html={course.description} emptyText="暂无描述" className="muted" />
                  <Space orientation="vertical" size={4}>
                    <Typography.Text type="secondary">教师：{course.ownerUsername}</Typography.Text>
                    <Typography.Text className="mono">邀请码：{course.inviteCode}</Typography.Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title="创建课程"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        onOk={() => {
          const form = document.getElementById("create-course-form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        okText="创建"
        cancelText="取消"
      >
        <Form id="create-course-form" layout="vertical" onSubmitCapture={onCreateCourse}>
          <Form.Item label="课程名称" required>
            <Input value={createTitle} onChange={(event) => setCreateTitle(event.target.value)} required />
          </Form.Item>
          <Form.Item label="课程描述">
            <RichTextEditor
              value={createDescription}
              onChange={setCreateDescription}
              placeholder="简介课程目标、内容安排或适合人群"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="加入课程"
        open={showJoinModal}
        onCancel={() => setShowJoinModal(false)}
        onOk={() => {
          const form = document.getElementById("join-course-form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        okText="加入"
        cancelText="取消"
      >
        <Form id="join-course-form" layout="vertical" onSubmitCapture={onJoinCourse}>
          <Form.Item label="邀请码" required>
            <Input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="请输入邀请码" required />
          </Form.Item>
        </Form>
      </Modal>
    </PersonalShell>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  BellOutlined,
  CalendarOutlined,
  FileOutlined,
  NotificationOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  List,
  Select,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { coursesApi } from "@/lib/api/courses";
import { announcementsApi } from "@/lib/api/announcements";
import { experimentsApi } from "@/lib/api/experiments";
import { resourcesApi } from "@/lib/api/resources";
import { gradesApi } from "@/lib/api/grades";
import type { CourseAnnouncement, CourseDetail, CourseGradeOverview, CourseResource, ResourceType } from "@/lib/api/types";
import { PlatformShell } from "@/components/platform-shell";
import { useAuth } from "@/lib/auth/auth-context";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { user, loading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [announcements, setAnnouncements] = useState<CourseAnnouncement[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [gradeOverview, setGradeOverview] = useState<CourseGradeOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("FILE");
  const [resourceCategory, setResourceCategory] = useState("");
  const [resourceExternalUrl, setResourceExternalUrl] = useState("");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceSubmitting, setResourceSubmitting] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);

  const loadCourse = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [detail, announcementData, resourceData, overview] = await Promise.all([
        coursesApi.detail(courseId),
        announcementsApi.list(courseId),
        resourcesApi.list(courseId),
        user?.role === "TEACHER" ? gradesApi.overview(courseId) : Promise.resolve(null),
      ]);
      setCourse(detail);
      setAnnouncements(announcementData.items);
      setResources(resourceData.items);
      setGradeOverview(overview);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载课程详情失败");
      setCourse(null);
      setAnnouncements([]);
      setResources([]);
      setGradeOverview(null);
    } finally {
      setBusy(false);
    }
  }, [courseId, user?.role]);

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

  const onCreateResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResourceSubmitting(true);
    try {
      await resourcesApi.create(courseId, {
        name: resourceName,
        type: resourceType,
        category: resourceCategory || undefined,
        externalUrl: resourceType === "FILE" ? undefined : resourceExternalUrl,
        file: resourceType === "FILE" ? (resourceFile ?? undefined) : undefined,
      });
      setResourceName("");
      setResourceCategory("");
      setResourceExternalUrl("");
      setResourceFile(null);
      setResourceType("FILE");
      await loadCourse();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "上传资源失败");
    } finally {
      setResourceSubmitting(false);
    }
  };

  const onCreateAnnouncement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAnnouncementSubmitting(true);
    try {
      await announcementsApi.create(courseId, {
        title: announcementTitle,
        content: announcementContent,
      });
      setAnnouncementTitle("");
      setAnnouncementContent("");
      await loadCourse();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "发布公告失败");
    } finally {
      setAnnouncementSubmitting(false);
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
          <Link href={`/courses/${courseId}/learning`}>
            <Button>课程学习</Button>
          </Link>
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

          <Card title="课程资源" style={{ marginTop: 16 }}>
            {busy ? (
              <Spin />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={resources}
                locale={{ emptyText: "暂无课程资源" }}
                renderItem={(resource) => (
                  <List.Item
                    actions={[
                      resource.type === "FILE" ? (
                        <a
                          key={resource.id}
                          href={resourcesApi.buildFileUrl(resource.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          下载
                        </a>
                      ) : (
                        <a key={resource.id} href={resource.externalUrl ?? "#"} target="_blank" rel="noreferrer">
                          打开链接
                        </a>
                      ),
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <FileOutlined />
                          <span>{resource.name}</span>
                          <Tag>{resource.type}</Tag>
                          {resource.category ? <Tag color="cyan">{resource.category}</Tag> : null}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Typography.Text type="secondary">
                            上传者：{resource.uploadedBy.displayName || resource.uploadedBy.username}
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            上传时间：{new Date(resource.uploadedAt).toLocaleString("zh-CN")}
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

          {user.role === "TEACHER" ? (
            <Card title="上传课程资源" style={{ marginTop: 16 }}>
              <Form layout="vertical" onSubmitCapture={onCreateResource}>
                <Form.Item label="资源名称" required>
                  <Input value={resourceName} onChange={(event) => setResourceName(event.target.value)} required />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item label="资源类型" required>
                      <Select
                        value={resourceType}
                        options={[
                          { label: "文件", value: "FILE" },
                          { label: "视频链接", value: "VIDEO" },
                          { label: "参考链接", value: "LINK" },
                        ]}
                        onChange={(value) => setResourceType(value)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="分类">
                      <Input value={resourceCategory} onChange={(event) => setResourceCategory(event.target.value)} placeholder="如：课件/视频/参考资料" />
                    </Form.Item>
                  </Col>
                </Row>
                {resourceType === "FILE" ? (
                  <Form.Item label="上传文件" required>
                    <Input type="file" onChange={(event) => setResourceFile(event.target.files?.[0] ?? null)} required />
                  </Form.Item>
                ) : (
                  <Form.Item label="外部链接" required>
                    <Input value={resourceExternalUrl} onChange={(event) => setResourceExternalUrl(event.target.value)} placeholder="https://" required />
                  </Form.Item>
                )}
                <Button type="primary" htmlType="submit" loading={resourceSubmitting}>
                  上传资源
                </Button>
              </Form>
            </Card>
          ) : null}
        </Col>

        <Col xs={24} xl={7}>
          <Card title="课堂公告" extra={<Tag color="gold">{announcements.length}</Tag>}>
            {user.role === "TEACHER" ? (
              <Form layout="vertical" onSubmitCapture={onCreateAnnouncement} style={{ marginBottom: 16 }}>
                <Form.Item label="公告标题" required>
                  <Input value={announcementTitle} onChange={(event) => setAnnouncementTitle(event.target.value)} required />
                </Form.Item>
                <Form.Item label="公告内容" required>
                  <Input.TextArea
                    value={announcementContent}
                    onChange={(event) => setAnnouncementContent(event.target.value)}
                    rows={4}
                    required
                    placeholder="例如：本周实验要求、课堂提醒、材料更新"
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={announcementSubmitting} block>
                  发布公告
                </Button>
              </Form>
            ) : null}
            <List
              dataSource={announcements}
              locale={{ emptyText: "暂无课堂公告" }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <Space direction="vertical" size={0}>
                        <Typography.Text type="secondary">{item.content}</Typography.Text>
                        <Typography.Text type="secondary">
                          {item.createdBy.displayName || item.createdBy.username} · {new Date(item.createdAt).toLocaleString("zh-CN")}
                        </Typography.Text>
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

          {user.role === "TEACHER" ? (
            <Card title="成绩汇总" style={{ marginTop: 16 }}>
              <List
                dataSource={gradeOverview?.students || []}
                locale={{ emptyText: "暂无成绩数据" }}
                renderItem={(item) => (
                  <List.Item>
                    <Space direction="vertical" size={0} style={{ width: "100%" }}>
                      <Space>
                        <Typography.Text strong>{item.student.displayName || item.student.username}</Typography.Text>
                        <Tag color="blue">已提交 {item.submissionCount}</Tag>
                        <Tag color={item.gradedCount > 0 ? "green" : "default"}>已评分 {item.gradedCount}</Tag>
                        <Tag>均分 {item.averageScore ?? "-"}</Tag>
                      </Space>
                      {item.experiments.length > 0 ? (
                        <>
                          <Divider style={{ margin: "8px 0" }} />
                          {item.experiments.map((experiment) => (
                            <Typography.Text key={experiment.submissionId} type="secondary">
                              {experiment.experimentTitle}：{experiment.score ?? "待评分"}
                            </Typography.Text>
                          ))}
                        </>
                      ) : (
                        <Typography.Text type="secondary">暂无提交</Typography.Text>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          ) : null}
        </Col>
      </Row>
    </PlatformShell>
  );
}

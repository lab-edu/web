"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BellOutlined, FileOutlined, ReadOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Card, Col, Empty, List, Row, Space, Spin, Tabs, Tag, Typography } from "antd";
import { announcementsApi } from "@/lib/api/announcements";
import { coursesApi } from "@/lib/api/courses";
import { learningApi } from "@/lib/api/learning";
import { resourcesApi } from "@/lib/api/resources";
import type { CourseAnnouncement, CourseDetail, CourseResource, CourseLearningOverview } from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { CourseShell } from "@/components/course-shell";
import { useAuth } from "@/lib/auth/auth-context";

export default function CourseManagePage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { user, loading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [announcements, setAnnouncements] = useState<CourseAnnouncement[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [overview, setOverview] = useState<CourseLearningOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [detail, announcementData, resourceData, overviewData] = await Promise.all([
        coursesApi.detail(courseId),
        announcementsApi.list(courseId),
        resourcesApi.list(courseId),
        learningApi.overview(courseId),
      ]);
      setCourse(detail);
      setAnnouncements(announcementData.items);
      setResources(resourceData.items);
      setOverview(overviewData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载管理数据失败");
      setCourse(null);
      setAnnouncements([]);
      setResources([]);
      setOverview(null);
    } finally {
      setBusy(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!loading && user) {
      void loadData();
    }
  }, [loading, user, loadData]);

  if (loading || !user) {
    return <AuthLoadingState />;
  }

  if (user.role !== "TEACHER") {
    return (
      <CourseShell title={course?.title || "课程管理"} subtitle="当前账号没有管理权限。" courseId={courseId}>
        <Card>
          <Empty description="仅教师可进入课程管理" />
        </Card>
      </CourseShell>
    );
  }

  return (
    <CourseShell title={course?.title || "课程管理"} subtitle="按类型查看课程管理内容。" courseId={courseId}>
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card><Typography.Text type="secondary">成员</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{course?.members.length ?? 0}</Typography.Title></Card></Col>
        <Col xs={24} md={8}><Card><Typography.Text type="secondary">通知</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{announcements.length}</Typography.Title></Card></Col>
        <Col xs={24} md={8}><Card><Typography.Text type="secondary">资源</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{resources.length}</Typography.Title></Card></Col>
      </Row>

      <Card style={{ marginTop: 16 }} loading={busy}>
        <Tabs
          items={[
            {
              key: "members",
              label: "成员管理",
              children: (
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
              ),
            },
            {
              key: "announcements",
              label: "通知管理",
              children: (
                <List
                  dataSource={announcements}
                  locale={{ emptyText: "暂无通知" }}
                  renderItem={(item) => (
                    <List.Item extra={<Link href={`/courses/${courseId}`}>查看通知页</Link>}>
                      <List.Item.Meta
                        title={<Space><BellOutlined />{item.title}</Space>}
                        description={<Typography.Text type="secondary">{item.content}</Typography.Text>}
                      />
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: "experiments",
              label: "实验管理",
              children: (
                <List
                  dataSource={course?.experiments || []}
                  locale={{ emptyText: "暂无实验" }}
                  renderItem={(item) => (
                    <List.Item extra={<Link href={`/courses/${courseId}/experiments`}>查看实验页</Link>}>
                      <List.Item.Meta
                        title={<Space><ReadOutlined />{item.title}</Space>}
                        description={<Typography.Text type="secondary">{item.description || "暂无描述"}</Typography.Text>}
                      />
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: "resources",
              label: "资源管理",
              children: (
                <List
                  dataSource={resources}
                  locale={{ emptyText: "暂无资源" }}
                  renderItem={(item) => (
                    <List.Item extra={<Link href={`/courses/${courseId}/resources`}>查看资源页</Link>}>
                      <List.Item.Meta
                        title={<Space><FileOutlined />{item.name}</Space>}
                        description={<Typography.Text type="secondary">{item.category || item.type}</Typography.Text>}
                      />
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: "learning",
              label: "学习管理",
              children: overview ? (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}><Card><Typography.Text type="secondary">单元</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview.unitCount}</Typography.Title></Card></Col>
                    <Col xs={24} md={8}><Card><Typography.Text type="secondary">知识点</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview.pointCount}</Typography.Title></Card></Col>
                    <Col xs={24} md={8}><Card><Typography.Text type="secondary">任务</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview.taskCount}</Typography.Title></Card></Col>
                  </Row>
                  <Typography.Text type="secondary">教学内容管理已放在 <Link href={`/courses/${courseId}/learning`}>课程内容</Link> 页面中。</Typography.Text>
                </Space>
              ) : (
                <Empty description="暂无学习管理数据" />
              ),
            },
          ]}
        />
      </Card>
    </CourseShell>
  );
}

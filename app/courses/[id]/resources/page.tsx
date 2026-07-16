"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FileOutlined, EyeOutlined } from "@ant-design/icons";
import { Alert, Card, Empty, List, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { coursesApi } from "@/lib/api/courses";
import { resourcesApi } from "@/lib/api/resources";
import type { CourseDetail, CourseResource } from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { CourseShell } from "@/components/course-shell";
import { RefreshButton } from "@/components/refresh-button";
import { useAuth } from "@/lib/auth/auth-context";

export default function CourseResourcesPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { user, loading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [detail, resourceData] = await Promise.all([
        coursesApi.detail(courseId),
        resourcesApi.list(courseId),
      ]);
      setCourse(detail);
      setResources(resourceData.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载课程资源失败");
      setCourse(null);
      setResources([]);
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

  return (
    <CourseShell title={course?.title || "课程资源"} subtitle="课程资源集中管理。" courseId={courseId} actions={<RefreshButton onClick={() => void loadData()} loading={busy} />}>
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}


      <Card title={<Space><FileOutlined />课程资源</Space>} loading={busy}>
        {resources.length ? (
          <List
            itemLayout="horizontal"
            dataSource={resources}
            renderItem={(resource) => (
              <List.Item
                actions={[
                  resource.type === "FILE" ? (
                    <Space key="actions">
                      <Link href={`/courses/${courseId}/resources/${resource.id}`} legacyBehavior>
                        <a><EyeOutlined /> 预览</a>
                      </Link>
                      <a key="download" href={resourcesApi.buildFileUrl(resource.id)} target="_blank" rel="noreferrer">
                        下载
                      </a>
                    </Space>
                  ) : (
                    <a key="open" href={resource.externalUrl ?? "#"} target="_blank" rel="noreferrer">
                      打开链接
                    </a>
                  ),
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      {resource.type === "FILE" ? (
                        <Link href={`/courses/${courseId}/resources/${resource.id}`} legacyBehavior>
                          <a>{resource.name}</a>
                        </Link>
                      ) : (
                        <span>{resource.name}</span>
                      )}
                      <Tag>{resource.type}</Tag>
                      {resource.category ? <Tag color="cyan">{resource.category}</Tag> : null}
                    </Space>
                  }
                  description={
                    <Space orientation="vertical" size={0}>
                      <Typography.Text type="secondary">上传者：{resource.uploadedBy.displayName || resource.uploadedBy.username}</Typography.Text>
                      <Typography.Text type="secondary">上传时间：{new Date(resource.uploadedAt).toLocaleString("zh-CN")}</Typography.Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无课程资源" />
        )}
      </Card>
    </CourseShell>
  );
}

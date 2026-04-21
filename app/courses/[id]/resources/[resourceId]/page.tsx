"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert, Card, Empty, Space, Tag, Typography, Button } from "antd";
import { FileOutlined, DownloadOutlined, EyeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import { resourcesApi } from "@/lib/api/resources";
import type { CourseResource } from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { CourseShell } from "@/components/course-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { PreviewRenderer } from "./preview-renderer";

export default function ResourcePreviewPage() {
  const params = useParams<{ id: string; resourceId: string }>();
  const courseId = params.id;
  const resourceId = params.resourceId;
  const { user, loading } = useAuth();

  const [resource, setResource] = useState<CourseResource | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const resourceData = await resourcesApi.list(courseId);
      const found = resourceData.items.find((r) => r.id === resourceId);
      if (found) {
        setResource(found);
      } else {
        setError("未找到该资源");
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载资源失败");
      setResource(null);
    } finally {
      setBusy(false);
    }
  }, [courseId, resourceId]);

  useEffect(() => {
    if (!loading && user) {
      void loadData();
    }
  }, [loading, user, loadData]);

  if (loading || !user) {
    return <AuthLoadingState />;
  }

  return (
    <CourseShell
      title={resource?.name || "资源预览"}
      subtitle="预览或下载课程资源"
      courseId={courseId}
      actions={
        <Space>
          <Link href={`/courses/${courseId}/resources`}>
            <Button icon={<ArrowLeftOutlined />}>返回资源列表</Button>
          </Link>
          <Button icon={<EyeOutlined />} onClick={() => window.open(resourcesApi.buildFileUrl(resourceId), "_blank")}>
            打开文件
          </Button>
        </Space>
      }
    >
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

      <Card
        title={
          <Space>
            <FileOutlined />
            {resource?.name || "资源预览"}
          </Space>
        }
        loading={busy}
        extra={
          resource && (
            <Space>
              <Tag>{resource.type}</Tag>
              {resource.category && <Tag color="cyan">{resource.category}</Tag>}
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                href={resourcesApi.buildFileUrl(resourceId)}
                target="_blank"
              >
                下载
              </Button>
            </Space>
          )
        }
      >
        {resource ? (
          <div>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Typography.Paragraph>
                <Typography.Text strong>资源名称：</Typography.Text>
                {resource.name}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <Typography.Text strong>上传者：</Typography.Text>
                {resource.uploadedBy.displayName || resource.uploadedBy.username}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <Typography.Text strong>上传时间：</Typography.Text>
                {new Date(resource.uploadedAt).toLocaleString("zh-CN")}
              </Typography.Paragraph>
              {resource.fileName && (
                <Typography.Paragraph>
                  <Typography.Text strong>文件名：</Typography.Text>
                  {resource.fileName}
                </Typography.Paragraph>
              )}
              {resource.externalUrl && (
                <Typography.Paragraph>
                  <Typography.Text strong>外部链接：</Typography.Text>
                  <a href={resource.externalUrl} target="_blank" rel="noreferrer">
                    {resource.externalUrl}
                  </a>
                </Typography.Paragraph>
              )}
            </Space>

            <div style={{ marginTop: 24 }}>
              <PreviewRenderer resource={resource} />
            </div>
          </div>
        ) : (
          <Empty description="资源不存在或已被删除" />
        )}
      </Card>
    </CourseShell>
  );
}
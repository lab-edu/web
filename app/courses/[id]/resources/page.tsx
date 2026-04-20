"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { FileOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Empty, Form, Input, List, Row, Select, Space, Tag, Typography } from "antd";
import { coursesApi } from "@/lib/api/courses";
import { resourcesApi } from "@/lib/api/resources";
import type { CourseDetail, CourseResource, ResourceType } from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { CourseShell } from "@/components/course-shell";
import { RefreshButton } from "@/components/refresh-button";
import { useAuth } from "@/lib/auth/auth-context";

export default function CourseResourcesPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const courseId = params.id;
  const { user, loading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resourceName, setResourceName] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("FILE");
  const [resourceCategory, setResourceCategory] = useState("");
  const [resourceExternalUrl, setResourceExternalUrl] = useState("");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const onCreateResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
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
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "上传资源失败");
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
    <CourseShell title={course?.title || "课程资源"} subtitle="课程资源集中管理。" courseId={courseId} actions={<RefreshButton onClick={() => void loadData()} loading={busy} />}>
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}


      <Card title={<Space><FileOutlined />课程资源</Space>} loading={busy}>
        {resources.length ? (
          <List
            itemLayout="horizontal"
            dataSource={resources}
            renderItem={(resource) => (
              <List.Item actions={[resource.type === "FILE" ? <a key="download" href={resourcesApi.buildFileUrl(resource.id)} target="_blank" rel="noreferrer">下载</a> : <a key="open" href={resource.externalUrl ?? "#"} target="_blank" rel="noreferrer">打开链接</a>]}> 
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{resource.name}</span>
                      <Tag>{resource.type}</Tag>
                      {resource.category ? <Tag color="cyan">{resource.category}</Tag> : null}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
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

"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Space, message } from "antd";
import { assignmentsApi } from "@/lib/api/assignments";
import { coursesApi } from "@/lib/api/courses";
import type { AssignmentCreateRequest, CourseDetail } from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { AssignmentEditorForm } from "@/components/assignment-editor-form";
import { CourseShell } from "@/components/course-shell";
import { useAuth } from "@/lib/auth/auth-context";

export default function CreateAssignmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params.id;
  const { user, loading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourse = useCallback(async () => {
    try {
      const courseDetail = await coursesApi.detail(courseId);
      setCourse(courseDetail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载课程信息失败");
    }
  }, [courseId]);

  useEffect(() => {
    if (!loading && user) {
      void loadCourse();
    }
  }, [loading, user, loadCourse]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const handleSubmit = async (payload: AssignmentCreateRequest) => {
    setBusy(true);
    setError(null);
    try {
      await assignmentsApi.create(courseId, payload);
      message.success("作业创建成功");
      router.push(`/courses/${courseId}/assignments`);
    } catch (submitError) {
      const msg = submitError instanceof Error ? submitError.message : "创建作业失败";
      setError(msg);
      message.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <AuthLoadingState />;
  }

  if (!user) {
    return <AuthLoadingState message="正在跳转到登录页..." />;
  }

  if (!course) {
    return <AuthLoadingState message="加载课程信息中..." />;
  }

  const isTeacher =
    user.role === "ADMIN" ||
    course.owner.id === user.id ||
    !!course.members?.some((m) => m.user.id === user.id && m.memberRole === "TEACHER");

  if (!isTeacher) {
    return (
      <CourseShell title="无权限" subtitle="您没有权限创建作业" courseId={courseId}>
        <Alert type="error" message="只有课程教师可以创建作业" />
      </CourseShell>
    );
  }

  return (
    <CourseShell
      title="新建作业"
      subtitle="创建包含多道题目的作业"
      courseId={courseId}
      actions={
        <Space>
          <Button onClick={() => router.push(`/courses/${courseId}/assignments`)}>返回列表</Button>
        </Space>
      }
    >
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}
      <AssignmentEditorForm
        submitting={busy}
        submitText="创建作业"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/courses/${courseId}/assignments`)}
      />
    </CourseShell>
  );
}

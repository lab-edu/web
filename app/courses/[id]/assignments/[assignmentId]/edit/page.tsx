"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Modal, Space, message } from "antd";
import { assignmentsApi } from "@/lib/api/assignments";
import { coursesApi } from "@/lib/api/courses";
import type {
  AssignmentResponse,
  AssignmentUpdateRequest,
  CourseDetail,
} from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { AssignmentEditorForm } from "@/components/assignment-editor-form";
import { CourseShell } from "@/components/course-shell";
import { useAuth } from "@/lib/auth/auth-context";

const { confirm } = Modal;

export default function EditAssignmentPage() {
  const params = useParams<{ id: string; assignmentId: string }>();
  const router = useRouter();
  const courseId = params.id;
  const assignmentId = params.assignmentId;
  const { user, loading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [courseDetail, assignmentDetail] = await Promise.all([
        coursesApi.detail(courseId),
        assignmentsApi.detail(courseId, assignmentId),
      ]);
      setCourse(courseDetail);
      setAssignment(assignmentDetail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载作业信息失败");
    } finally {
      setLoadingData(false);
    }
  }, [courseId, assignmentId]);

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

  const handleSubmit = async (payload: AssignmentUpdateRequest) => {
    setBusy(true);
    setError(null);
    try {
      await assignmentsApi.update(courseId, assignmentId, payload);
      message.success("作业更新成功");
      router.push(`/courses/${courseId}/assignments/${assignmentId}`);
    } catch (submitError) {
      const msg = submitError instanceof Error ? submitError.message : "更新作业失败";
      setError(msg);
      message.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    confirm({
      title: "确认删除作业",
      content: "删除后将无法恢复，所有提交记录也将被删除。确定要删除吗？",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      async onOk() {
        try {
          await assignmentsApi.delete(courseId, assignmentId);
          message.success("作业删除成功");
          router.push(`/courses/${courseId}/assignments`);
        } catch (deleteError) {
          message.error(deleteError instanceof Error ? deleteError.message : "删除失败");
        }
      },
    });
  };

  if (loading) {
    return <AuthLoadingState />;
  }

  if (!user) {
    return <AuthLoadingState message="正在跳转到登录页..." />;
  }

  if (loadingData) {
    return <AuthLoadingState message="加载作业信息中..." />;
  }

  if (!course || !assignment) {
    return (
      <CourseShell title="作业不存在" subtitle="" courseId={courseId}>
        <Alert type="error" message={error || "作业不存在或已删除"} />
      </CourseShell>
    );
  }

  const isTeacher =
    user.role === "ADMIN" ||
    course.owner.id === user.id ||
    !!course.members?.some((m) => m.user.id === user.id && m.memberRole === "TEACHER");

  if (!isTeacher) {
    return (
      <CourseShell title="无权限" subtitle="您没有权限编辑作业" courseId={courseId}>
        <Alert type="error" message="只有课程教师可以编辑作业" />
      </CourseShell>
    );
  }

  return (
    <CourseShell
      title={`编辑作业：${assignment.title}`}
      subtitle="修改作业内容和设置"
      courseId={courseId}
      actions={
        <Space>
          <Button onClick={() => router.push(`/courses/${courseId}/assignments/${assignmentId}`)}>
            返回详情
          </Button>
          <Button danger onClick={handleDelete}>
            删除作业
          </Button>
        </Space>
      }
    >
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}
      <AssignmentEditorForm
        initial={assignment}
        submitting={busy}
        submitText="保存修改"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/courses/${courseId}/assignments/${assignmentId}`)}
      />
    </CourseShell>
  );
}

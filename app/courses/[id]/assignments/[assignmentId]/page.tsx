"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  FormOutlined,
  EditOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Radio,
  Checkbox,
  Space,
  Tag,
  Typography,
  Statistic,
  message,
  Descriptions,
  Row,
  Col,
} from "antd";
import { assignmentsApi } from "@/lib/api/assignments";
import { coursesApi } from "@/lib/api/courses";
import type {
  AssignmentResponse,
  CourseDetail,
  AssignmentSubmissionResponse,
} from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { CourseShell } from "@/components/course-shell";
import { RichTextRenderer } from "@/components/rich-text-renderer";
import { useAuth } from "@/lib/auth/auth-context";

const { TextArea } = Input;

function encodeAnswer(raw: unknown): string {
  if (Array.isArray(raw)) {
    return JSON.stringify(raw);
  }
  return String(raw ?? "").trim();
}

function decodeMultiAnswer(raw: string): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
  } catch {
    return raw.split("||").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function formatSubmittedAnswer(raw: string, questionType: AssignmentResponse["taskItems"][number]["questionType"]): string {
  if (!raw) {
    return "未作答";
  }
  if (questionType === "MULTIPLE_CHOICE") {
    const values = decodeMultiAnswer(raw);
    return values.length ? values.join("，") : raw;
  }
  return raw;
}

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string; assignmentId: string }>();
  const router = useRouter();
  const courseId = params.id;
  const assignmentId = params.assignmentId;
  const { user, loading } = useAuth();
  const [form] = Form.useForm();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [latestSubmission, setLatestSubmission] = useState<AssignmentSubmissionResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const loadData = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [courseDetail, assignmentDetail, submission] = await Promise.all([
        coursesApi.detail(courseId),
        assignmentsApi.detail(courseId, assignmentId),
        assignmentsApi.getLatestSubmission(courseId, assignmentId).catch(() => null),
      ]);
      setCourse(courseDetail);
      setAssignment(assignmentDetail);
      setLatestSubmission(submission);

      // 如果已有提交，初始化表单
      if (submission?.answers) {
        const initialValues: Record<string, string | string[]> = {};
        const questionTypeByTaskId = new Map(assignmentDetail.taskItems.map((item) => [item.id, item.questionType]));
        submission.answers.forEach((answer) => {
          const questionType = questionTypeByTaskId.get(answer.taskItemId);
          if (questionType === "MULTIPLE_CHOICE") {
            initialValues[`answer_${answer.taskItemId}`] = decodeMultiAnswer(answer.answer);
          } else {
            initialValues[`answer_${answer.taskItemId}`] = answer.answer;
          }
        });
        form.setFieldsValue(initialValues);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载作业详情失败");
    } finally {
      setLoadingData(false);
    }
  }, [courseId, assignmentId, form]);

  useEffect(() => {
    if (!loading && user) {
      loadData();
    }
  }, [loading, user, loadData]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const handleSubmit = async () => {
    if (!assignment) return;

    setIsSubmitting(true);
    try {
      const values = form.getFieldsValue();
      const answers = assignment.taskItems.map((item) => ({
        taskItemId: item.id,
        answer: encodeAnswer(values[`answer_${item.id}`]),
      }));

      await assignmentsApi.submit(courseId, assignmentId, { answers });
      message.success("作业提交成功");
      loadData(); // 重新加载数据
    } catch (submitError) {
      message.error(submitError instanceof Error ? submitError.message : "提交失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <AuthLoadingState />;
  }

  if (!user) {
    return <AuthLoadingState message="正在跳转到登录页..." />;
  }

  if (loadingData) {
    return <AuthLoadingState message="加载作业详情中..." />;
  }

  if (!course || !assignment) {
    return (
      <CourseShell title="作业不存在" subtitle="" courseId={courseId}>
        <Alert type="error" message={error || "作业不存在或已删除"} />
      </CourseShell>
    );
  }

  const isTeacher = user.role === "ADMIN" || course.owner.id === user.id ||
    !!course.members?.some((m) => m.user.id === user.id && m.memberRole === "TEACHER");
  const isPublished = assignment.published;
  const isOverdue = assignment.dueAt && new Date(assignment.dueAt) < new Date();
  const isStarted = !assignment.startAt || new Date(assignment.startAt) <= new Date();
  const canSubmit = isPublished && isStarted && !isOverdue && !isTeacher;

  // 学生已提交状态
  const hasSubmitted = !!latestSubmission;
  const isGraded = hasSubmitted && latestSubmission!.totalScore !== null;

  return (
    <CourseShell
      title={assignment.title}
      subtitle={assignment.description || "作业详情"}
      courseId={courseId}
      actions={
        <Space>
          <Button onClick={() => router.push(`/courses/${courseId}/assignments`)}>返回列表</Button>
          {isTeacher && (
            <>
              <Button icon={<EditOutlined />} onClick={() => router.push(`/courses/${courseId}/assignments/${assignmentId}/edit`)}>
                编辑
              </Button>
              <Button type="primary" onClick={() => router.push(`/courses/${courseId}/assignments/${assignmentId}/submissions`)}>
                查看提交
              </Button>
            </>
          )}
        </Space>
      }
    >
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, md: 3 }} title="作业信息">
          <Descriptions.Item label="状态">
            {!isPublished ? (
              <Tag color="orange">未发布</Tag>
            ) : isOverdue ? (
              <Tag color="red">已截止</Tag>
            ) : isStarted ? (
              <Tag color="green">进行中</Tag>
            ) : (
              <Tag color="blue">未开始</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="必做">
            {assignment.required ? <Tag color="red">必做</Tag> : <Tag>选做</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="总分">
            <Typography.Text strong>{assignment.totalScore}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="题目数量">
            <Typography.Text strong>{assignment.taskItems.length}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="开始时间">
            {assignment.startAt ? (
              <Space>
                <CalendarOutlined />
                {new Date(assignment.startAt).toLocaleString("zh-CN")}
              </Space>
            ) : (
              "无限制"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="截止时间">
            {assignment.dueAt ? (
              <Space>
                <CalendarOutlined />
                {new Date(assignment.dueAt).toLocaleString("zh-CN")}
                {isOverdue && <Tag color="red">已过期</Tag>}
              </Space>
            ) : (
              "无限制"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="创建者">
            {assignment.createdBy.displayName || assignment.createdBy.username}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(assignment.createdAt).toLocaleString("zh-CN")}
          </Descriptions.Item>
        </Descriptions>

        {assignment.description && (
          <div style={{ marginTop: 16 }}>
            <Typography.Title level={5}>作业描述</Typography.Title>
            <RichTextRenderer html={assignment.description} />
          </div>
        )}
      </Card>

      {/* 学生提交状态显示 */}
      {!isTeacher && hasSubmitted && (
        <Card style={{ marginBottom: 16 }} type="inner">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Typography.Title level={5}>
              <Space>
                {isGraded ? <CheckCircleOutlined style={{ color: "#52c41a" }} /> : <ClockCircleOutlined />}
                {isGraded ? "已批改" : "已提交，待批改"}
              </Space>
            </Typography.Title>

            {isGraded && latestSubmission && (
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Statistic title="总分" value={latestSubmission.totalScore!} suffix={`/ ${assignment.totalScore}`} />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic title="批改时间" value={latestSubmission.gradedAt ? new Date(latestSubmission.gradedAt).toLocaleString("zh-CN") : "-"} />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic title="批改者" value={latestSubmission.gradedBy?.displayName || latestSubmission.gradedBy?.username || "-"} />
                </Col>
              </Row>
            )}

            {latestSubmission?.feedback && (
              <div>
                <Typography.Title level={5}>教师反馈</Typography.Title>
                <RichTextRenderer html={latestSubmission.feedback} />
              </div>
            )}

            <Alert
              message={isGraded ? "作业已批改，如需重新提交请直接提交新答案" : "作业已提交，等待教师批改"}
              type={isGraded ? "success" : "info"}
              showIcon
            />
          </Space>
        </Card>
      )}

      {/* 作业题目 */}
      <Card
        title={
          <Space>
            <FormOutlined />
            题目列表
            <Tag>共 {assignment.taskItems.length} 题</Tag>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          {assignment.taskItems.map((item, index) => (
            <Card
              key={item.id}
              type="inner"
              title={`第 ${index + 1} 题 (${item.maxScore}分)`}
              style={{ marginBottom: 16 }}
              extra={
                <Space>
                  <Tag color="blue">
                    {item.questionType === "SINGLE_CHOICE" && "单选题"}
                    {item.questionType === "MULTIPLE_CHOICE" && "多选题"}
                    {item.questionType === "SHORT_ANSWER" && "简答题"}
                  </Tag>
                  {isTeacher && item.referenceAnswer && (
                    <Tag color="green">参考答案: {item.referenceAnswer}</Tag>
                  )}
                </Space>
              }
            >
              <Typography.Paragraph strong>{item.question}</Typography.Paragraph>

              {item.options && item.options.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Typography.Text type="secondary">选项：</Typography.Text>
                  {item.questionType === "SINGLE_CHOICE" ? (
                    <Form.Item name={`answer_${item.id}`}>
                      <Radio.Group disabled={!canSubmit || (hasSubmitted && isGraded)}>
                        <Space direction="vertical">
                          {item.options.map((option, optIndex) => (
                            <Radio key={optIndex} value={option}>
                              {option}
                            </Radio>
                          ))}
                        </Space>
                      </Radio.Group>
                    </Form.Item>
                  ) : item.questionType === "MULTIPLE_CHOICE" ? (
                    <Form.Item name={`answer_${item.id}`}>
                      <Checkbox.Group disabled={!canSubmit || (hasSubmitted && isGraded)}>
                        <Space direction="vertical">
                          {item.options.map((option, optIndex) => (
                            <Checkbox key={optIndex} value={option}>
                              {option}
                            </Checkbox>
                          ))}
                        </Space>
                      </Checkbox.Group>
                    </Form.Item>
                  ) : null}
                </div>
              )}

              {item.questionType === "SHORT_ANSWER" && (
                <Form.Item name={`answer_${item.id}`}>
                  <TextArea
                    rows={4}
                    placeholder="请输入答案"
                    disabled={!canSubmit || (hasSubmitted && isGraded)}
                  />
                </Form.Item>
              )}

              {/* 显示学生已有答案（如果已提交） */}
              {!isTeacher && hasSubmitted && latestSubmission && (
                <div style={{ marginTop: 16, padding: 12, background: "#f6ffed", borderRadius: 6 }}>
                  <Typography.Text strong>您的答案：</Typography.Text>
                  {(() => {
                    const answer = latestSubmission.answers.find(a => a.taskItemId === item.id);
                    if (!answer) return <Typography.Text type="secondary">未作答</Typography.Text>;

                    return (
                      <div>
                        <Typography.Paragraph>{formatSubmittedAnswer(answer.answer, item.questionType)}</Typography.Paragraph>
                        {isGraded && (
                          <Space>
                            <Typography.Text type="secondary">得分：</Typography.Text>
                            <Typography.Text strong>
                              {answer.score !== null ? `${answer.score}/${item.maxScore}` : "未评分"}
                            </Typography.Text>
                            {answer.feedback && (
                              <>
                                <Typography.Text type="secondary">反馈：</Typography.Text>
                                <Typography.Text>{answer.feedback}</Typography.Text>
                              </>
                            )}
                          </Space>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </Card>
          ))}

          {!isTeacher && canSubmit && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={hasSubmitted && isGraded}
              >
                {hasSubmitted ? "重新提交" : "提交作业"}
              </Button>
              {hasSubmitted && isGraded && (
                <Typography.Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                  作业已批改，如需重新提交请直接点击&quot;重新提交&quot;
                </Typography.Text>
              )}
            </div>
          )}

          {!canSubmit && !isTeacher && (
            <Alert
              message={
                !isPublished
                  ? "作业尚未发布"
                  : !isStarted
                  ? "作业尚未开始"
                  : isOverdue
                  ? "作业已截止"
                  : "无法提交作业"
              }
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Form>
      </Card>
    </CourseShell>
  );
}
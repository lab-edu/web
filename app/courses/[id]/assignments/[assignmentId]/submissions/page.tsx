"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  CheckOutlined,
  UserOutlined,
  CalendarOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Table,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Statistic,
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
import { useAuth } from "@/lib/auth/auth-context";


interface GradeFormValues {
  feedback?: string;
  totalScore?: number;
  [key: string]: string | number | undefined; // 动态字段：score_xxx 和 feedback_xxx
}

interface User {
  id: string;
  username: string;
  displayName?: string | null;
}


export default function AssignmentSubmissionsPage() {
  const params = useParams<{ id: string; assignmentId: string }>();
  const router = useRouter();
  const courseId = params.id;
  const assignmentId = params.assignmentId;
  const { user, loading } = useAuth();
  const [gradeForm] = Form.useForm();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionResponse[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmissionResponse | null>(null);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [grading, setGrading] = useState(false);
  const [aiGrading, setAiGrading] = useState(false);


  const loadData = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [courseDetail, assignmentDetail, submissionsList] = await Promise.all([
        coursesApi.detail(courseId),
        assignmentsApi.detail(courseId, assignmentId),
        assignmentsApi.listSubmissions(courseId, assignmentId),
      ]);
      setCourse(courseDetail);
      setAssignment(assignmentDetail);
      setSubmissions(submissionsList);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载提交列表失败");
    } finally {
      setLoadingData(false);
    }
  }, [courseId, assignmentId]);

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

  const openGradeModal = (submission: AssignmentSubmissionResponse) => {
    setGradingSubmission(submission);
    gradeForm.resetFields();

    // 初始化表单值
    const initialValues: GradeFormValues = {
      feedback: submission.feedback || "",
      totalScore: submission.totalScore || undefined,
    };

    // 初始化每题分数
    submission.answers.forEach((answer) => {
      initialValues[`score_${answer.taskItemId}`] = answer.score || 0;
      initialValues[`feedback_${answer.taskItemId}`] = answer.feedback || "";
    });

    gradeForm.setFieldsValue(initialValues);
    setGradeModalVisible(true);
  };

  const handleGradeSubmit = async (values: GradeFormValues) => {
    if (!gradingSubmission || !assignment) return;

    setGrading(true);
    try {
      // 提取每题分数和反馈
      const itemGrades = assignment.taskItems.map((item) => {
        const score = values[`score_${item.id}`] || 0;
        const feedback = values[`feedback_${item.id}`] || "";
        return {
          taskItemId: item.id,
          score: Number(score),
          feedback: String(feedback).trim() || undefined,
        };
      });

      const payload = {
        itemGrades,
        totalScore: values.totalScore,
        feedback: values.feedback,
      };

      await assignmentsApi.grade(courseId, gradingSubmission.id, payload);
      message.success("批改成功");
      setGradeModalVisible(false);
      loadData(); // 重新加载数据
    } catch (gradeError) {
      message.error(gradeError instanceof Error ? gradeError.message : "批改失败");
    } finally {
      setGrading(false);
    }
  };

  const handleAiGradeDraft = async () => {
    if (!gradingSubmission || !assignment) return;

    setAiGrading(true);
    try {
      const aiDraft = await assignmentsApi.aiGradeDraft(courseId, assignment.id, gradingSubmission.id);
      const nextValues: GradeFormValues = {
        feedback: aiDraft.feedback ?? "",
        totalScore: aiDraft.totalScore,
      };

      aiDraft.itemGrades.forEach((item) => {
        nextValues[`score_${item.taskItemId}`] = item.score;
        nextValues[`feedback_${item.taskItemId}`] = item.feedback ?? "";
      });

      gradeForm.setFieldsValue(nextValues);
      message.success("AI 批改建议已填充，可修改后提交");
    } catch (aiError) {
      message.error(aiError instanceof Error ? aiError.message : "AI 批改失败");
    } finally {
      setAiGrading(false);
    }
  };

  const calculateStatistics = () => {
    const totalStudents = course?.members?.length || 0;
    const submittedCount = submissions.length;
    const gradedCount = submissions.filter(s => s.totalScore !== null).length;
    const averageScore = gradedCount > 0
      ? submissions.filter(s => s.totalScore !== null)
          .reduce((sum, s) => sum + (s.totalScore || 0), 0) / gradedCount
      : null;

    return { totalStudents, submittedCount, gradedCount, averageScore };
  };

  if (loading) {
    return <AuthLoadingState />;
  }

  if (!user) {
    return <AuthLoadingState message="正在跳转到登录页..." />;
  }

  if (loadingData) {
    return <AuthLoadingState message="加载提交列表中..." />;
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
  if (!isTeacher) {
    return (
      <CourseShell title="无权限" subtitle="您没有权限查看提交" courseId={courseId}>
        <Alert type="error" message="只有课程教师可以查看作业提交" />
      </CourseShell>
    );
  }

  const stats = calculateStatistics();

  const columns = [
    {
      title: "学生",
      dataIndex: "submittedBy",
      key: "student",
      render: (submittedBy: User) => (
        <Space>
          <UserOutlined />
          <span>{submittedBy.displayName || submittedBy.username}</span>
          <Tag color="blue">{submittedBy.username}</Tag>
        </Space>
      ),
    },
    {
      title: "提交时间",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (submittedAt: string) => (
        <Space>
          <CalendarOutlined />
          {new Date(submittedAt).toLocaleString("zh-CN")}
        </Space>
      ),
    },
    {
      title: "状态",
      key: "status",
      render: (_: unknown, record: AssignmentSubmissionResponse) => (
        <Space>
          {record.latest && <Tag color="green">最新</Tag>}
          {record.totalScore !== null ? (
            <Tag color="success">已批改</Tag>
          ) : (
            <Tag color="orange">待批改</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "分数",
      dataIndex: "totalScore",
      key: "score",
      render: (totalScore: number | null) =>
        totalScore !== null ? (
          <Typography.Text strong>{totalScore} / {assignment.totalScore}</Typography.Text>
        ) : (
          <Typography.Text type="secondary">未批改</Typography.Text>
        ),
    },
    {
      title: "批改者",
      dataIndex: "gradedBy",
      key: "gradedBy",
      render: (gradedBy: User | null) =>
        gradedBy ? (
          <span>{gradedBy.displayName || gradedBy.username}</span>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: AssignmentSubmissionResponse) => (
        <Space>
          <Button
            size="small"
            type={record.totalScore !== null ? "default" : "primary"}
            icon={<CheckOutlined />}
            onClick={() => openGradeModal(record)}
          >
            {record.totalScore !== null ? "重新批改" : "批改"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <CourseShell
      title={`作业提交管理：${assignment.title}`}
      subtitle="查看和批改学生提交的作业"
      courseId={courseId}
      actions={
        <Space>
          <Button onClick={() => router.push(`/courses/${courseId}/assignments/${assignmentId}`)}>
            返回作业详情
          </Button>
          <Button type="primary" onClick={loadData} loading={loadingData}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Statistic title="课程学生数" value={stats.totalStudents} />
          </Col>
          <Col xs={24} md={6}>
            <Statistic title="已提交" value={stats.submittedCount} suffix={`/ ${stats.totalStudents}`} />
          </Col>
          <Col xs={24} md={6}>
            <Statistic title="已批改" value={stats.gradedCount} suffix={`/ ${stats.submittedCount}`} />
          </Col>
          <Col xs={24} md={6}>
            <Statistic
              title="平均分"
              value={stats.averageScore !== null ? stats.averageScore.toFixed(1) : 0}
              suffix={stats.averageScore !== null ? ` / ${assignment.totalScore}` : ""}
            />
          </Col>
        </Row>
      </Card>

      <Card title="提交列表">
        <Table
          columns={columns}
          dataSource={submissions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loadingData}
        />
      </Card>

      {/* 批改模态框 */}
      <Modal
        title={`批改作业提交 - ${gradingSubmission?.submittedBy?.displayName || gradingSubmission?.submittedBy?.username}`}
        open={gradeModalVisible}
        onCancel={() => setGradeModalVisible(false)}
        footer={null}
        width={800}
      >
        {gradingSubmission && assignment && (
          <Form
            form={gradeForm}
            layout="vertical"
            onFinish={handleGradeSubmit}
          >
            <Card title="每题批改" style={{ marginBottom: 16 }}>
              {assignment.taskItems.map((item, index) => {
                const answer = gradingSubmission.answers.find(a => a.taskItemId === item.id);
                return (
                  <Card
                    key={item.id}
                    type="inner"
                    title={`第 ${index + 1} 题：${item.question}`}
                    style={{ marginBottom: 12 }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Typography.Text strong>学生答案：</Typography.Text>
                      <Typography.Paragraph>
                        {answer?.answer || "未作答"}
                      </Typography.Paragraph>

                      {item.options && item.options.length > 0 && (
                        <div>
                          <Typography.Text strong>选项：</Typography.Text>
                          <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                            {item.options.map((option, optIndex) => (
                              <li key={optIndex}>{option}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.referenceAnswer && (
                        <div>
                          <Typography.Text strong type="secondary">参考答案：</Typography.Text>
                          <Typography.Paragraph type="secondary">
                            {item.referenceAnswer}
                          </Typography.Paragraph>
                        </div>
                      )}

                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label={`分数（满分 ${item.maxScore}）`}
                            name={`score_${item.id}`}
                            rules={[
                              { required: true, message: "请输入分数" },
                              { type: "number", min: 0, max: item.maxScore, message: `分数必须在 0-${item.maxScore} 之间` },
                            ]}
                          >
                            <InputNumber
                              min={0}
                              max={item.maxScore}
                              style={{ width: "100%" }}
                              placeholder="请输入分数"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="题目反馈"
                            name={`feedback_${item.id}`}
                          >
                            <Input.TextArea rows={2} placeholder="针对本题的反馈（可选）" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                );
              })}
            </Card>

            <Card title="总体批改" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="总分"
                    name="totalScore"
                    rules={[
                      { required: true, message: "请输入总分" },
                      { type: "number", min: 0, max: assignment.totalScore, message: `总分必须在 0-${assignment.totalScore} 之间` },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={assignment.totalScore}
                      style={{ width: "100%" }}
                      placeholder={`请输入总分（满分 ${assignment.totalScore}）`}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="总体反馈"
                name="feedback"
              >
                <Input.TextArea rows={4} placeholder="输入对本次作业的总体反馈（可选）" />
              </Form.Item>
            </Card>

            <div style={{ textAlign: "right" }}>
              <Space>
                <Button icon={<RobotOutlined />} loading={aiGrading} onClick={() => void handleAiGradeDraft()}>
                  AI 批改建议
                </Button>
                <Button onClick={() => setGradeModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={grading}>
                  提交批改
                </Button>
              </Space>
            </div>
          </Form>
        )}
      </Modal>
    </CourseShell>
  );
}
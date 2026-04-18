"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { BookOutlined, BulbOutlined, FileOutlined, ReloadOutlined } from "@ant-design/icons";
import { PlatformShell } from "@/components/platform-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { learningApi } from "@/lib/api/learning";
import type {
  CourseLearningDetail,
  CourseLearningOverview,
  CourseLearningTaskSubmission,
  LearningMaterialType,
  LearningQuestionType,
  LearningTaskType,
} from "@/lib/api/types";

const taskTypeOptions: Array<{ label: string; value: LearningTaskType }> = [
  { label: "媒体学习", value: "MEDIA" },
  { label: "随堂测试", value: "QUIZ" },
];

const materialTypeOptions: Array<{ label: string; value: LearningMaterialType }> = [
  { label: "文件", value: "FILE" },
  { label: "链接", value: "LINK" },
  { label: "文本", value: "TEXT" },
];

const questionTypeOptions: Array<{ label: string; value: LearningQuestionType }> = [
  { label: "单选题", value: "SINGLE_CHOICE" },
  { label: "多选题", value: "MULTIPLE_CHOICE" },
  { label: "简答题", value: "SHORT_ANSWER" },
];

export default function CourseLearningPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { user, loading } = useAuth();

  const [detail, setDetail] = useState<CourseLearningDetail | null>(null);
  const [overview, setOverview] = useState<CourseLearningOverview | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskSubmissions, setTaskSubmissions] = useState<CourseLearningTaskSubmission[]>([]);
  const [latestSubmission, setLatestSubmission] = useState<CourseLearningTaskSubmission | null>(null);
  const [busy, setBusy] = useState(false);
  const [taskBusy, setTaskBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [unitTitle, setUnitTitle] = useState("");
  const [unitDescription, setUnitDescription] = useState("");
  const [unitSortOrder, setUnitSortOrder] = useState<number | null>(null);
  const [unitPublished, setUnitPublished] = useState(true);

  const [pointTitle, setPointTitle] = useState("");
  const [pointSummary, setPointSummary] = useState("");
  const [pointEstimatedMinutes, setPointEstimatedMinutes] = useState<number | null>(null);
  const [pointSortOrder, setPointSortOrder] = useState<number | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskType, setTaskType] = useState<LearningTaskType>("MEDIA");
  const [materialType, setMaterialType] = useState<LearningMaterialType>("FILE");
  const [contentText, setContentText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [questionType, setQuestionType] = useState<LearningQuestionType>("SINGLE_CHOICE");
  const [optionsText, setOptionsText] = useState("");
  const [referenceAnswer, setReferenceAnswer] = useState("");
  const [taskMaxScore, setTaskMaxScore] = useState<number | null>(10);
  const [taskRequired, setTaskRequired] = useState(true);
  const [taskSortOrder, setTaskSortOrder] = useState<number | null>(null);
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const [answerText, setAnswerText] = useState("");
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [studentSubmitting, setStudentSubmitting] = useState(false);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { score?: number; feedback?: string; loading?: boolean }>>({});

  const isTeacher = user?.role === "TEACHER";

  const loadData = async () => {
    setBusy(true);
    setError(null);
    try {
      const [detailData, overviewData] = await Promise.all([
        learningApi.detail(courseId),
        learningApi.overview(courseId),
      ]);
      setDetail(detailData);
      setOverview(overviewData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载课程学习数据失败");
      setDetail(null);
      setOverview(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      void loadData();
    }
  }, [loading, user, courseId]);

  useEffect(() => {
    if (!detail?.units?.length) {
      setSelectedUnitId(null);
      setSelectedPointId(null);
      setSelectedTaskId(null);
      return;
    }

    const validUnit = selectedUnitId && detail.units.some((unit) => unit.id === selectedUnitId)
      ? selectedUnitId
      : detail.units[0].id;
    setSelectedUnitId(validUnit);
  }, [detail, selectedUnitId]);

  const selectedUnit = useMemo(
    () => detail?.units.find((unit) => unit.id === selectedUnitId) ?? null,
    [detail, selectedUnitId],
  );

  useEffect(() => {
    if (!selectedUnit?.points?.length) {
      setSelectedPointId(null);
      setSelectedTaskId(null);
      return;
    }

    const validPoint = selectedPointId && selectedUnit.points.some((point) => point.id === selectedPointId)
      ? selectedPointId
      : selectedUnit.points[0].id;
    setSelectedPointId(validPoint);
  }, [selectedUnit, selectedPointId]);

  const selectedPoint = useMemo(
    () => selectedUnit?.points.find((point) => point.id === selectedPointId) ?? null,
    [selectedUnit, selectedPointId],
  );

  useEffect(() => {
    if (!selectedPoint?.tasks?.length) {
      setSelectedTaskId(null);
      return;
    }

    const validTask = selectedTaskId && selectedPoint.tasks.some((task) => task.id === selectedTaskId)
      ? selectedTaskId
      : selectedPoint.tasks[0].id;
    setSelectedTaskId(validTask);
  }, [selectedPoint, selectedTaskId]);

  const selectedTask = useMemo(
    () => selectedPoint?.tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedPoint, selectedTaskId],
  );

  useEffect(() => {
    if (!selectedTaskId) {
      setTaskSubmissions([]);
      setLatestSubmission(null);
      return;
    }

    let active = true;
    const loadTaskState = async () => {
      setTaskBusy(true);
      try {
        if (isTeacher) {
          const submissions = await learningApi.taskSubmissions(courseId, selectedTaskId);
          if (active) {
            setTaskSubmissions(submissions.items);
            setLatestSubmission(null);
          }
        } else {
          const latest = await learningApi.latestSubmission(courseId, selectedTaskId);
          if (active) {
            setLatestSubmission(latest);
            setTaskSubmissions([]);
          }
        }
      } catch (taskError) {
        if (active) {
          setTaskSubmissions([]);
          setLatestSubmission(null);
          if (taskError instanceof Error && !(taskError.message.includes("没有找到最新提交") && !isTeacher)) {
            setError(taskError.message);
          }
        }
      } finally {
        if (active) {
          setTaskBusy(false);
        }
      }
    };

    void loadTaskState();

    return () => {
      active = false;
    };
  }, [courseId, isTeacher, selectedTaskId]);

  const reloadTaskState = async () => {
    if (!selectedTaskId) {
      return;
    }

    setTaskBusy(true);
    try {
      if (isTeacher) {
        const submissions = await learningApi.taskSubmissions(courseId, selectedTaskId);
        setTaskSubmissions(submissions.items);
      } else {
        const latest = await learningApi.latestSubmission(courseId, selectedTaskId);
        setLatestSubmission(latest);
      }
    } catch (taskError) {
      if (!(taskError instanceof Error && taskError.message.includes("没有找到最新提交"))) {
        setError(taskError instanceof Error ? taskError.message : "加载答卷失败");
      }
    } finally {
      setTaskBusy(false);
    }
  };

  const createUnit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await learningApi.createUnit(courseId, {
        title: unitTitle,
        description: unitDescription,
        sortOrder: unitSortOrder ?? undefined,
        published: unitPublished,
      });
      setUnitTitle("");
      setUnitDescription("");
      setUnitSortOrder(null);
      setUnitPublished(true);
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建学习单元失败");
    }
  };

  const createPoint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUnitId) {
      setError("请先选择一个学习单元");
      return;
    }
    setError(null);
    try {
      await learningApi.createPoint(courseId, selectedUnitId, {
        title: pointTitle,
        summary: pointSummary,
        estimatedMinutes: pointEstimatedMinutes ?? undefined,
        sortOrder: pointSortOrder ?? undefined,
      });
      setPointTitle("");
      setPointSummary("");
      setPointEstimatedMinutes(null);
      setPointSortOrder(null);
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建知识点失败");
    }
  };

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPointId) {
      setError("请先选择一个知识点");
      return;
    }

    setTaskSubmitting(true);
    setError(null);
    try {
      await learningApi.createTask(courseId, selectedPointId, {
        title: taskTitle,
        description: taskDescription,
        taskType,
        materialType: taskType === "MEDIA" ? materialType : undefined,
        contentText: contentText || undefined,
        mediaUrl: mediaUrl || undefined,
        questionType: taskType === "QUIZ" ? questionType : undefined,
        optionsText: taskType === "QUIZ" ? optionsText : undefined,
        referenceAnswer: referenceAnswer || undefined,
        maxScore: taskMaxScore ?? undefined,
        required: taskRequired,
        sortOrder: taskSortOrder ?? undefined,
        file: taskType === "MEDIA" && materialType === "FILE" ? taskFile ?? undefined : undefined,
      });
      setTaskTitle("");
      setTaskDescription("");
      setContentText("");
      setMediaUrl("");
      setOptionsText("");
      setReferenceAnswer("");
      setTaskMaxScore(10);
      setTaskRequired(true);
      setTaskSortOrder(null);
      setTaskFile(null);
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建学习任务失败");
    } finally {
      setTaskSubmitting(false);
    }
  };

  const submitTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTaskId) {
      return;
    }
    setStudentSubmitting(true);
    setError(null);
    try {
      await learningApi.submitTask(courseId, selectedTaskId, {
        answerText: answerText || undefined,
        file: answerFile ?? undefined,
      });
      setAnswerText("");
      setAnswerFile(null);
      await reloadTaskState();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交答卷失败");
    } finally {
      setStudentSubmitting(false);
    }
  };

  const gradeSubmission = async (submission: CourseLearningTaskSubmission) => {
    const draft = gradeDrafts[submission.id] ?? {};
    if (draft.score === undefined || Number.isNaN(draft.score)) {
      setError("请先填写评分分数");
      return;
    }

    setError(null);
    setGradeDrafts((current) => ({
      ...current,
      [submission.id]: { ...draft, loading: true },
    }));

    try {
      await learningApi.gradeSubmission(courseId, submission.id, {
        score: draft.score,
        feedback: draft.feedback,
      });
      await reloadTaskState();
    } catch (gradeError) {
      setError(gradeError instanceof Error ? gradeError.message : "评分失败");
    } finally {
      setGradeDrafts((current) => ({
        ...current,
        [submission.id]: { ...current[submission.id], loading: false },
      }));
    }
  };

  const overviewStudents = overview?.students ?? [];

  if (loading || !user) {
    return (
      <main className="auth-page">
        <Spin size="large" tip="正在同步登录状态..." />
      </main>
    );
  }

  return (
    <PlatformShell
      title={detail?.courseTitle || "课程学习"}
      subtitle="教师组织单元、知识点与任务，学生在同一界面完成学习、提交与批阅查看。"
      actions={(
        <Space>
          <Link href={`/courses/${courseId}`}>
            <Button>返回课程</Button>
          </Link>
          <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
            刷新
          </Button>
        </Space>
      )}
    >
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">学习单元</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {overview?.unitCount ?? 0}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">知识点</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {overview?.pointCount ?? 0}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">学习任务</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {overview?.taskCount ?? 0}
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={15}>
          {isTeacher ? (
            <Card title="组织课程结构" style={{ marginBottom: 16 }}>
              <Form layout="vertical" onSubmitCapture={createUnit}>
                <Form.Item label="学习单元标题" required>
                  <Input value={unitTitle} onChange={(event) => setUnitTitle(event.target.value)} required />
                </Form.Item>
                <Form.Item label="单元简介">
                  <Input.TextArea value={unitDescription} rows={3} onChange={(event) => setUnitDescription(event.target.value)} />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} md={8}>
                    <Form.Item label="排序">
                      <InputNumber value={unitSortOrder} min={0} onChange={(value) => setUnitSortOrder(typeof value === "number" ? value : null)} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="发布状态">
                      <Select
                        value={unitPublished ? "published" : "draft"}
                        options={[
                          { label: "已发布", value: "published" },
                          { label: "草稿", value: "draft" },
                        ]}
                        onChange={(value) => setUnitPublished(value === "published")}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label=" ">
                      <Button type="primary" htmlType="submit" block>
                        创建单元
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

              <Divider />

              <Form layout="vertical" onSubmitCapture={createPoint}>
                <Form.Item label="选择单元" required>
                  <Select
                    value={selectedUnitId ?? undefined}
                    placeholder="先选择一个单元"
                    options={(detail?.units ?? []).map((unit) => ({ label: unit.title, value: unit.id }))}
                    onChange={(value) => setSelectedUnitId(value)}
                  />
                </Form.Item>
                <Form.Item label="知识点标题" required>
                  <Input value={pointTitle} onChange={(event) => setPointTitle(event.target.value)} required />
                </Form.Item>
                <Form.Item label="知识点说明">
                  <Input.TextArea value={pointSummary} rows={3} onChange={(event) => setPointSummary(event.target.value)} />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} md={8}>
                    <Form.Item label="预计时长（分钟）">
                      <InputNumber value={pointEstimatedMinutes} min={0} onChange={(value) => setPointEstimatedMinutes(typeof value === "number" ? value : null)} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="排序">
                      <InputNumber value={pointSortOrder} min={0} onChange={(value) => setPointSortOrder(typeof value === "number" ? value : null)} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label=" ">
                      <Button block htmlType="submit">
                        创建知识点
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

              <Divider />

              <Form layout="vertical" onSubmitCapture={createTask}>
                <Form.Item label="选择知识点" required>
                  <Select
                    value={selectedPointId ?? undefined}
                    placeholder="先选择一个知识点"
                    options={(selectedUnit?.points ?? []).map((point) => ({ label: point.title, value: point.id }))}
                    onChange={(value) => setSelectedPointId(value)}
                  />
                </Form.Item>
                <Form.Item label="任务标题" required>
                  <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} required />
                </Form.Item>
                <Form.Item label="任务说明">
                  <Input.TextArea value={taskDescription} rows={3} onChange={(event) => setTaskDescription(event.target.value)} />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} md={8}>
                    <Form.Item label="任务类型">
                      <Select value={taskType} options={taskTypeOptions} onChange={(value) => setTaskType(value)} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="分值">
                      <InputNumber value={taskMaxScore} min={0} step={1} onChange={(value) => setTaskMaxScore(typeof value === "number" ? value : null)} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="排序">
                      <InputNumber value={taskSortOrder} min={0} onChange={(value) => setTaskSortOrder(typeof value === "number" ? value : null)} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
                {taskType === "MEDIA" ? (
                  <>
                    <Row gutter={12}>
                      <Col xs={24} md={8}>
                        <Form.Item label="媒体类型">
                          <Select value={materialType} options={materialTypeOptions} onChange={(value) => setMaterialType(value)} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={16}>
                        <Form.Item label="媒体内容">
                          {materialType === "LINK" ? (
                            <Input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="视频 / 外部链接" />
                          ) : materialType === "TEXT" ? (
                            <Input.TextArea value={contentText} rows={4} onChange={(event) => setContentText(event.target.value)} placeholder="输入文本学习内容" />
                          ) : (
                            <Input type="file" onChange={(event) => setTaskFile(event.target.files?.[0] ?? null)} />
                          )}
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <>
                    <Row gutter={12}>
                      <Col xs={24} md={8}>
                        <Form.Item label="题型">
                          <Select value={questionType} options={questionTypeOptions} onChange={(value) => setQuestionType(value)} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={16}>
                        <Form.Item label="题目内容">
                          <Input.TextArea value={contentText} rows={4} onChange={(event) => setContentText(event.target.value)} placeholder="题干或说明" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item label="选项">
                      <Input.TextArea value={optionsText} rows={4} onChange={(event) => setOptionsText(event.target.value)} placeholder="每行一个选项，单选/多选必填" />
                    </Form.Item>
                    <Form.Item label="参考答案">
                      <Input.TextArea value={referenceAnswer} rows={2} onChange={(event) => setReferenceAnswer(event.target.value)} placeholder="教师参考答案，可选" />
                    </Form.Item>
                  </>
                )}
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item label="是否必做">
                      <Select
                        value={taskRequired ? "required" : "optional"}
                        options={[
                          { label: "必做", value: "required" },
                          { label: "选做", value: "optional" },
                        ]}
                        onChange={(value) => setTaskRequired(value === "required")}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Button type="primary" htmlType="submit" loading={taskSubmitting}>
                  创建任务
                </Button>
              </Form>
            </Card>
          ) : null}

          <Card title={<Space><BookOutlined />课程结构</Space>} loading={busy}>
            {detail?.units?.length ? (
              <Collapse
                items={detail.units.map((unit) => ({
                  key: unit.id,
                  label: (
                    <Space wrap>
                      <span>{unit.title}</span>
                      <Tag color={unit.published ? "green" : "default"}>{unit.published ? "已发布" : "草稿"}</Tag>
                      <Tag>排序 {unit.sortOrder}</Tag>
                    </Space>
                  ),
                  children: (
                    <Space direction="vertical" size={16} style={{ width: "100%" }}>
                      {unit.description ? <Typography.Paragraph type="secondary">{unit.description}</Typography.Paragraph> : null}
                      {unit.points.length ? unit.points.map((point) => (
                        <Card
                          key={point.id}
                          size="small"
                          title={(
                            <Space wrap>
                              <BulbOutlined />
                              <span>{point.title}</span>
                              {point.estimatedMinutes ? <Tag color="cyan">预计 {point.estimatedMinutes} 分钟</Tag> : null}
                            </Space>
                          )}
                          extra={<Button type={selectedPointId === point.id ? "primary" : "default"} onClick={() => setSelectedPointId(point.id)}>查看任务</Button>}
                        >
                          {point.summary ? <Typography.Paragraph type="secondary">{point.summary}</Typography.Paragraph> : null}
                          {point.tasks.length ? (
                            <List
                              dataSource={point.tasks}
                              renderItem={(task) => (
                                <List.Item
                                  actions={[
                                    <Button key="select" type={selectedTaskId === task.id ? "primary" : "default"} onClick={() => setSelectedTaskId(task.id)}>
                                      打开
                                    </Button>,
                                  ]}
                                >
                                  <List.Item.Meta
                                    title={(
                                      <Space wrap>
                                        <FileOutlined />
                                        <span>{task.title}</span>
                                        <Tag>{task.taskType === "MEDIA" ? "媒体学习" : "随堂测试"}</Tag>
                                        <Tag>分值 {task.maxScore}</Tag>
                                      </Space>
                                    )}
                                    description={task.description || "暂无说明"}
                                  />
                                </List.Item>
                              )}
                            />
                          ) : (
                            <Empty description="该知识点暂无任务" />
                          )}
                        </Card>
                      )) : <Empty description="该单元暂无知识点" />}
                    </Space>
                  ),
                }))}
              />
            ) : (
              <Empty description="当前课程还没有学习结构" />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card title="任务详情" style={{ marginBottom: 16 }}>
            {selectedTask ? (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Space wrap>
                  <Tag color="blue">{selectedTask.taskType === "MEDIA" ? "媒体学习" : "随堂测试"}</Tag>
                  <Tag>分值 {selectedTask.maxScore}</Tag>
                  {selectedTask.required ? <Tag color="red">必做</Tag> : <Tag>选做</Tag>}
                </Space>
                <Typography.Title level={4} style={{ margin: 0 }}>{selectedTask.title}</Typography.Title>
                {selectedTask.description ? <Typography.Paragraph>{selectedTask.description}</Typography.Paragraph> : null}
                {selectedTask.taskType === "MEDIA" ? (
                  <>
                    {selectedTask.materialType === "FILE" ? (
                      <a href={learningApi.taskFileUrl(courseId, selectedTask.id)} target="_blank" rel="noreferrer">下载学习文件</a>
                    ) : null}
                    {selectedTask.materialType === "LINK" && selectedTask.mediaUrl ? (
                      <a href={selectedTask.mediaUrl} target="_blank" rel="noreferrer">打开学习链接</a>
                    ) : null}
                    {selectedTask.materialType === "TEXT" && selectedTask.contentText ? (
                      <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>{selectedTask.contentText}</Typography.Paragraph>
                    ) : null}
                  </>
                ) : (
                  <>
                    {selectedTask.contentText ? <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>{selectedTask.contentText}</Typography.Paragraph> : null}
                    {selectedTask.options.length ? (
                      <List
                        size="small"
                        bordered
                        dataSource={selectedTask.options}
                        renderItem={(option, index) => <List.Item>{String.fromCharCode(65 + index)}. {option}</List.Item>}
                      />
                    ) : null}
                    {isTeacher && selectedTask.referenceAnswer ? (
                      <Alert style={{ marginTop: 12 }} type="info" showIcon message="参考答案" description={selectedTask.referenceAnswer} />
                    ) : null}
                  </>
                )}
              </Space>
            ) : (
              <Empty description="请选择一个任务查看详情" />
            )}
          </Card>

          {selectedTask && !isTeacher ? (
            <Card title="提交答卷" style={{ marginBottom: 16 }}>
              <Form layout="vertical" onSubmitCapture={submitTask}>
                <Form.Item label="作答文本">
                  <Input.TextArea value={answerText} rows={5} onChange={(event) => setAnswerText(event.target.value)} placeholder="填写你的答案或学习反馈" />
                </Form.Item>
                <Form.Item label="附加文件">
                  <Input type="file" onChange={(event) => setAnswerFile(event.target.files?.[0] ?? null)} />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={studentSubmitting}>
                  提交答卷
                </Button>
              </Form>
              <Divider />
              <Typography.Text type="secondary">最新提交</Typography.Text>
              {taskBusy ? <Spin /> : latestSubmission ? (
                <Space direction="vertical" size={4} style={{ width: "100%", marginTop: 8 }}>
                  <Typography.Text>提交时间：{new Date(latestSubmission.submittedAt).toLocaleString("zh-CN")}</Typography.Text>
                  <Typography.Text>答案：{latestSubmission.answerText || latestSubmission.fileName || "无"}</Typography.Text>
                  {latestSubmission.score !== null ? <Tag color="blue">评分 {latestSubmission.score}</Tag> : <Tag>待评分</Tag>}
                  {latestSubmission.feedback ? <Typography.Text>评语：{latestSubmission.feedback}</Typography.Text> : null}
                </Space>
              ) : <Empty description="尚无提交" />}
            </Card>
          ) : null}

          {selectedTask && isTeacher ? (
            <Card title="答卷批阅" style={{ marginBottom: 16 }}>
              {taskBusy ? (
                <Spin />
              ) : taskSubmissions.length ? (
                <List
                  dataSource={taskSubmissions}
                  renderItem={(submission) => (
                    <List.Item key={submission.id}>
                      <Space direction="vertical" size={4} style={{ width: "100%" }}>
                        <Space wrap>
                          <Typography.Text strong>{submission.submittedBy.displayName || submission.submittedBy.username}</Typography.Text>
                          {submission.latest ? <Tag color="green">最新</Tag> : null}
                          {submission.score !== null ? <Tag color="blue">评分 {submission.score}</Tag> : <Tag>待评分</Tag>}
                        </Space>
                        <Typography.Text type="secondary">提交时间：{new Date(submission.submittedAt).toLocaleString("zh-CN")}</Typography.Text>
                        {submission.answerText ? <Typography.Paragraph style={{ marginBottom: 0 }}>{submission.answerText}</Typography.Paragraph> : null}
                        {submission.fileName ? <Typography.Text type="secondary">附件：{submission.fileName}</Typography.Text> : null}
                        <Space wrap>
                          <InputNumber
                            min={0}
                            max={100}
                            precision={2}
                            placeholder="分数"
                            value={gradeDrafts[submission.id]?.score ?? submission.score ?? undefined}
                            onChange={(value) => {
                              setGradeDrafts((current) => ({
                                ...current,
                                [submission.id]: {
                                  ...current[submission.id],
                                  score: typeof value === "number" ? value : undefined,
                                },
                              }));
                            }}
                          />
                          <Input
                            style={{ width: 220 }}
                            placeholder="评语"
                            value={gradeDrafts[submission.id]?.feedback ?? submission.feedback ?? ""}
                            onChange={(event) => {
                              setGradeDrafts((current) => ({
                                ...current,
                                [submission.id]: {
                                  ...current[submission.id],
                                  feedback: event.target.value,
                                },
                              }));
                            }}
                          />
                          <Button type="primary" loading={gradeDrafts[submission.id]?.loading} onClick={() => void gradeSubmission(submission)}>
                            提交评分
                          </Button>
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="该任务暂无提交" />
              )}
            </Card>
          ) : null}

          <Card title="学习汇总">
            {busy ? (
              <Spin />
            ) : overviewStudents.length ? (
              <Collapse
                items={overviewStudents.map((student) => ({
                  key: student.student.id,
                  label: (
                    <Space wrap>
                      <span>{student.student.displayName || student.student.username}</span>
                      <Tag>提交 {student.submissionCount}</Tag>
                      <Tag color="blue">已批阅 {student.gradedCount}</Tag>
                      <Tag color="green">平均 {student.averageScore ?? "-"}</Tag>
                    </Space>
                  ),
                  children: (
                    <List
                      dataSource={student.tasks}
                      renderItem={(item) => (
                        <List.Item>
                          <Space direction="vertical" size={4} style={{ width: "100%" }}>
                            <Space wrap>
                              <Typography.Text strong>{item.unitTitle} / {item.pointTitle}</Typography.Text>
                              <Tag>{item.taskType === "MEDIA" ? "媒体学习" : "随堂测试"}</Tag>
                              <Tag>分值 {item.maxScore}</Tag>
                            </Space>
                            <Typography.Text>{item.taskTitle}</Typography.Text>
                            <Space wrap>
                              {item.submissionId ? <Tag color="green">已提交</Tag> : <Tag>未提交</Tag>}
                              {item.score !== null ? <Tag color="blue">评分 {item.score}</Tag> : null}
                              {item.submittedAt ? <Typography.Text type="secondary">提交：{new Date(item.submittedAt).toLocaleString("zh-CN")}</Typography.Text> : null}
                            </Space>
                          </Space>
                        </List.Item>
                      )}
                    />
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无学习汇总" />
            )}
          </Card>
        </Col>
      </Row>
    </PlatformShell>
  );
}

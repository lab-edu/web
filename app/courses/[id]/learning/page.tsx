"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
import { BookOutlined, BulbOutlined, FileOutlined, HolderOutlined, PlusOutlined } from "@ant-design/icons";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { CourseShell } from "@/components/course-shell";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichTextRenderer } from "@/components/rich-text-renderer";
import { RefreshButton } from "@/components/refresh-button";
import { useAuth } from "@/lib/auth/auth-context";
import { learningApi } from "@/lib/api/learning";
import type {
  CourseLearningDetail,
  CourseLearningOverview,
  CourseLearningTaskSubmission,
  LearningTaskKind,
  LearningMaterialType,
  LearningQuestionType,
  LearningTaskType,
} from "@/lib/api/types";

const taskTypeOptions: Array<{ label: string; value: LearningTaskType }> = [
  { label: "媒体学习", value: "MEDIA" },
  { label: "随堂测试", value: "QUIZ" },
];

const taskKindOptions: Array<{ label: string; value: LearningTaskKind }> = [
  { label: "学习任务", value: "LEARNING" },
  { label: "作业", value: "HOMEWORK" },
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

type DragNode = {
  level: "unit" | "point" | "task";
  id: string;
};

const sortByOrder = <T extends { sortOrder: number }>(items: T[]) => [...items].sort((left, right) => left.sortOrder - right.sortOrder);

const moveItem = (items: string[], fromId: string, toId: string) => {
  const fromIndex = items.indexOf(fromId);
  const toIndex = items.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return items;
  }

  const nextItems = [...items];
  const [moving] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, moving);
  return nextItems;
};

const nextSortOrder = <T extends { sortOrder: number }>(items: T[]) => {
  if (!items.length) {
    return 10;
  }
  return Math.max(...items.map((item) => item.sortOrder)) + 10;
};

export default function CourseLearningPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
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
  const [unitPublished, setUnitPublished] = useState(true);

  const [pointTitle, setPointTitle] = useState("");
  const [pointSummary, setPointSummary] = useState("");
  const [pointEstimatedMinutes, setPointEstimatedMinutes] = useState<number | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskType, setTaskType] = useState<LearningTaskType>("MEDIA");
  const [taskKind, setTaskKind] = useState<LearningTaskKind>("LEARNING");
  const [materialType, setMaterialType] = useState<LearningMaterialType>("FILE");
  const [contentText, setContentText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [questionType, setQuestionType] = useState<LearningQuestionType>("SINGLE_CHOICE");
  const [optionsText, setOptionsText] = useState("");
  const [referenceAnswer, setReferenceAnswer] = useState("");
  const [taskMaxScore, setTaskMaxScore] = useState<number | null>(10);
  const [taskStartAt, setTaskStartAt] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [notifyOnStart, setNotifyOnStart] = useState(true);
  const [notifyBeforeDue24h, setNotifyBeforeDue24h] = useState(true);
  const [notifyOnDue, setNotifyOnDue] = useState(true);
  const [taskRequired, setTaskRequired] = useState(true);
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [reorderBusyTaskId, setReorderBusyTaskId] = useState<string | null>(null);
  const [reorderBusyUnitId, setReorderBusyUnitId] = useState<string | null>(null);
  const [reorderBusyPointId, setReorderBusyPointId] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<DragNode | null>(null);

  const [answerText, setAnswerText] = useState("");
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [studentSubmitting, setStudentSubmitting] = useState(false);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { score?: number; feedback?: string; loading?: boolean }>>({});

  const isTeacher = user?.role === "TEACHER";
  const managementMode = isTeacher && searchParams.get("manage") === "1";

  const loadData = useCallback(async () => {
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
  }, [courseId]);

  useEffect(() => {
    if (!loading && user) {
      void loadData();
    }
  }, [loading, user, loadData]);

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

  const structureStats = useMemo(() => {
    const units = detail?.units ?? [];
    const points = units.reduce((count, unit) => count + (unit.points?.length ?? 0), 0);
    const tasks = units.reduce((count, unit) => count + unit.points.reduce((pointCount, point) => pointCount + (point.tasks?.length ?? 0), 0), 0);

    return { units: units.length, points, tasks };
  }, [detail]);

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
        sortOrder: nextSortOrder(detail?.units ?? []),
        published: unitPublished,
      });
      setUnitTitle("");
      setUnitDescription("");
      setUnitPublished(true);
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建学习单元失败");
    }
  };

  const createPoint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUnit) {
      setError("请先在预览中选择一个学习单元");
      return;
    }
    setError(null);
    try {
      await learningApi.createPoint(courseId, selectedUnit.id, {
        title: pointTitle,
        summary: pointSummary,
        estimatedMinutes: pointEstimatedMinutes ?? undefined,
        sortOrder: nextSortOrder(selectedUnit.points),
      });
      setPointTitle("");
      setPointSummary("");
      setPointEstimatedMinutes(null);
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建知识点失败");
    }
  };

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPoint) {
      setError("请先在预览中选择一个知识点");
      return;
    }

    setTaskSubmitting(true);
    setError(null);
    try {
      await learningApi.createTask(courseId, selectedPoint.id, {
        title: taskTitle,
        description: taskDescription,
        taskType,
        taskKind,
        materialType: taskType === "MEDIA" ? materialType : undefined,
        contentText: contentText || undefined,
        mediaUrl: mediaUrl || undefined,
        questionType: taskType === "QUIZ" ? questionType : undefined,
        optionsText: taskType === "QUIZ" ? optionsText : undefined,
        referenceAnswer: referenceAnswer || undefined,
        maxScore: taskMaxScore ?? undefined,
        startAt: taskStartAt || undefined,
        dueAt: taskDueAt || undefined,
        notifyOnStart,
        notifyBeforeDue24h,
        notifyOnDue,
        required: taskRequired,
        sortOrder: nextSortOrder(selectedPoint.tasks),
        file: taskType === "MEDIA" && materialType === "FILE" ? taskFile ?? undefined : undefined,
      });
      setTaskTitle("");
      setTaskDescription("");
      setContentText("");
      setMediaUrl("");
      setOptionsText("");
      setReferenceAnswer("");
      setTaskMaxScore(10);
      setTaskKind("LEARNING");
      setTaskStartAt("");
      setTaskDueAt("");
      setNotifyOnStart(true);
      setNotifyBeforeDue24h(true);
      setNotifyOnDue(true);
      setTaskRequired(true);
      setTaskFile(null);
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建学习任务失败");
    } finally {
      setTaskSubmitting(false);
    }
  };

  const reorderTask = async (pointId: string, taskId: string, targetTaskId: string) => {
    const targetPoint = detail?.units
      .flatMap((unit) => unit.points)
      .find((point) => point.id === pointId);
    if (!targetPoint) {
      return;
    }
    if (taskId === targetTaskId) {
      return;
    }

    const reorderedIds = moveItem(targetPoint.tasks.map((task) => task.id), taskId, targetTaskId);

    setReorderBusyTaskId(taskId);
    setError(null);
    try {
      await learningApi.reorderTasks(courseId, pointId, reorderedIds);
      await loadData();
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "任务重排失败");
    } finally {
      setReorderBusyTaskId(null);
    }
  };

  const reorderUnits = async (unitId: string, targetUnitId: string) => {
    if (!detail?.units?.length || unitId === targetUnitId) {
      return;
    }

    const orderedUnitIds = moveItem(detail.units.map((unit) => unit.id), unitId, targetUnitId);
    setReorderBusyUnitId(unitId);
    setError(null);
    try {
      await learningApi.reorderUnits(courseId, orderedUnitIds);
      await loadData();
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "单元重排失败");
    } finally {
      setReorderBusyUnitId(null);
    }
  };

  const reorderPoints = async (unitId: string, pointId: string, targetPointId: string) => {
    const targetUnit = detail?.units.find((unit) => unit.id === unitId);
    if (!targetUnit || pointId === targetPointId) {
      return;
    }

    const orderedPointIds = moveItem(targetUnit.points.map((point) => point.id), pointId, targetPointId);
    setReorderBusyPointId(pointId);
    setError(null);
    try {
      await learningApi.reorderPoints(courseId, unitId, orderedPointIds);
      await loadData();
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "知识点重排失败");
    } finally {
      setReorderBusyPointId(null);
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
    return <AuthLoadingState />;
  }

  return (
    <CourseShell
      courseId={courseId}
      title={detail?.courseTitle || "课程学习"}
      subtitle="教师组织单元、知识点与任务，学生在同一界面完成学习、提交与批阅查看。"
      actions={<RefreshButton onClick={() => void loadData()} loading={busy} />}
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
          {managementMode ? (
            <Card title="组织课程结构" style={{ marginBottom: 16 }}>
              <Form layout="vertical" onSubmitCapture={createUnit}>
                <Form.Item label="学习单元标题" required>
                  <Input value={unitTitle} onChange={(event) => setUnitTitle(event.target.value)} required />
                </Form.Item>
                <Form.Item label="单元简介">
                  <RichTextEditor
                    value={unitDescription}
                    onChange={setUnitDescription}
                    placeholder="为这个学习单元补充目标、范围或学习建议"
                  />
                </Form.Item>
                <Row gutter={12}>
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
                <Form.Item label="当前单元" required>
                  <Space wrap>
                    <Tag color="blue">{selectedUnit?.title ?? "请先在预览中选择一个学习单元"}</Tag>
                    {selectedUnit?.published ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag>}
                  </Space>
                </Form.Item>
                <Form.Item label="知识点标题" required>
                  <Input value={pointTitle} onChange={(event) => setPointTitle(event.target.value)} required />
                </Form.Item>
                <Form.Item label="知识点说明">
                  <RichTextEditor
                    value={pointSummary}
                    onChange={setPointSummary}
                    placeholder="说明这个知识点要掌握什么"
                  />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} md={8}>
                    <Form.Item label="预计时长（分钟）">
                      <InputNumber value={pointEstimatedMinutes} min={0} onChange={(value) => setPointEstimatedMinutes(typeof value === "number" ? value : null)} style={{ width: "100%" }} />
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
                <Form.Item label="当前知识点" required>
                  <Space wrap>
                    <Tag color="blue">{selectedPoint?.title ?? "请先在预览中选择一个知识点"}</Tag>
                    <Tag>{selectedUnit?.title ?? "无所属单元"}</Tag>
                  </Space>
                </Form.Item>
                <Form.Item label="任务标题" required>
                  <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} required />
                </Form.Item>
                <Form.Item label="任务说明">
                  <RichTextEditor
                    value={taskDescription}
                    onChange={setTaskDescription}
                    placeholder="补充任务背景、提交要求或评分说明"
                  />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} md={8}>
                    <Form.Item label="任务用途">
                      <Select value={taskKind} options={taskKindOptions} onChange={(value) => setTaskKind(value)} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="任务类型">
                      <Select value={taskType} options={taskTypeOptions} onChange={(value) => setTaskType(value)} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={4}>
                    <Form.Item label="分值">
                      <InputNumber value={taskMaxScore} min={0} step={1} onChange={(value) => setTaskMaxScore(typeof value === "number" ? value : null)} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
                {taskKind === "HOMEWORK" ? (
                  <>
                    <Row gutter={12}>
                      <Col xs={24} md={12}>
                        <Form.Item label="开始时间" required>
                          <Input type="datetime-local" value={taskStartAt} onChange={(event) => setTaskStartAt(event.target.value)} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="截止时间" required>
                          <Input type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} md={8}>
                        <Form.Item label="开始提醒">
                          <Select value={notifyOnStart ? "on" : "off"} options={[{ label: "开启", value: "on" }, { label: "关闭", value: "off" }]} onChange={(value) => setNotifyOnStart(value === "on")} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="截止前24h提醒">
                          <Select value={notifyBeforeDue24h ? "on" : "off"} options={[{ label: "开启", value: "on" }, { label: "关闭", value: "off" }]} onChange={(value) => setNotifyBeforeDue24h(value === "on")} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="截止提醒">
                          <Select value={notifyOnDue ? "on" : "off"} options={[{ label: "开启", value: "on" }, { label: "关闭", value: "off" }]} onChange={(value) => setNotifyOnDue(value === "on")} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ) : null}
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
                            <RichTextEditor
                              value={contentText}
                              onChange={setContentText}
                              placeholder="输入文本学习内容"
                            />
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
                          <RichTextEditor
                            value={contentText}
                            onChange={setContentText}
                            placeholder="题干或说明"
                          />
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

          <Card className="learning-structure-card" title={<Space><BookOutlined />课程结构</Space>} loading={busy}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Typography.Text type="secondary">
                {managementMode
                  ? "教师可以拖拽标题栏调整顺序，右侧按钮会把当前节点带入创建表单。"
                  : "课程内容按固定顺序展示，点击节点可以查看对应内容。"}
              </Typography.Text>
              {detail?.units?.length ? (
                <div className="learning-structure-summary">
                  <div className="learning-structure-summary-item">
                    <span>单元</span>
                    <strong>{structureStats.units}</strong>
                  </div>
                  <div className="learning-structure-summary-item">
                    <span>知识点</span>
                    <strong>{structureStats.points}</strong>
                  </div>
                  <div className="learning-structure-summary-item">
                    <span>任务</span>
                    <strong>{structureStats.tasks}</strong>
                  </div>
                </div>
              ) : null}
              {detail?.units?.length ? (
                <Collapse
                  className="learning-structure-collapse"
                  ghost
                  defaultActiveKey={selectedUnitId ? [selectedUnitId] : undefined}
                  items={sortByOrder(detail.units).map((unit) => ({
                    key: unit.id,
                    label: (
                      <Space
                        wrap
                        className="learning-structure-unit-label"
                        style={{ width: "100%", cursor: managementMode ? "grab" : "default", opacity: reorderBusyUnitId === unit.id ? 0.65 : 1 }}
                      >
                        <span
                          draggable={managementMode}
                          onDragStart={managementMode ? () => setDraggingNode({ level: "unit", id: unit.id }) : undefined}
                          onDragEnd={managementMode ? () => setDraggingNode(null) : undefined}
                          onDragOver={(event) => {
                            if (!managementMode) {
                              return;
                            }
                            event.preventDefault();
                          }}
                          onDrop={(event) => {
                            if (!managementMode || draggingNode?.level !== "unit") {
                              return;
                            }
                            event.preventDefault();
                            void reorderUnits(draggingNode.id, unit.id);
                            setDraggingNode(null);
                          }}
                          className="learning-structure-unit-title"
                        >
                          {managementMode ? <HolderOutlined className="learning-structure-handle" /> : null}
                          <span>{unit.title}</span>
                        </span>
                        {managementMode ? <Tag color={unit.published ? "green" : "default"}>{unit.published ? "已发布" : "草稿"}</Tag> : null}
                        {managementMode ? <Tag>排序 {unit.sortOrder}</Tag> : null}
                      </Space>
                    ),
                    extra: managementMode ? (
                      <Space onClick={(event) => event.stopPropagation()}>
                        <Button size="small" icon={<PlusOutlined />} onClick={() => setSelectedUnitId(unit.id)}>
                          知识点
                        </Button>
                      </Space>
                    ) : undefined,
                    children: (
                      <Space direction="vertical" size={16} style={{ width: "100%" }}>
                        {unit.description ? <Typography.Text type="secondary">{unit.description}</Typography.Text> : null}
                        {unit.points.length ? sortByOrder(unit.points).map((point, pointIndex) => (
                          <div
                            key={point.id}
                            className="learning-structure-point"
                            style={{
                              paddingTop: 12,
                              marginTop: pointIndex === 0 ? 0 : 12,
                              borderTop: pointIndex === 0 ? "none" : "1px solid rgba(22, 71, 159, 0.08)",
                              opacity: reorderBusyPointId === point.id ? 0.65 : 1,
                            }}
                          >
                            <Space wrap className="learning-structure-point-head" style={{ width: "100%", justifyContent: "space-between" }}>
                              <Space wrap>
                                <span
                                  draggable={managementMode}
                                  onDragStart={managementMode ? () => setDraggingNode({ level: "point", id: point.id }) : undefined}
                                  onDragEnd={managementMode ? () => setDraggingNode(null) : undefined}
                                  onDragOver={(event) => {
                                    if (!managementMode) {
                                      return;
                                    }
                                    event.preventDefault();
                                  }}
                                  onDrop={(event) => {
                                    if (!managementMode || draggingNode?.level !== "point") {
                                      return;
                                    }
                                    event.preventDefault();
                                    void reorderPoints(unit.id, draggingNode.id, point.id);
                                    setDraggingNode(null);
                                  }}
                                  className="learning-structure-point-title"
                                >
                                  {managementMode ? <BulbOutlined className="learning-structure-handle" /> : null}
                                  <span>知识点 {pointIndex + 1}</span>
                                  <strong>{point.title}</strong>
                                </span>
                                {point.estimatedMinutes ? <Tag color="cyan">预计 {point.estimatedMinutes} 分钟</Tag> : null}
                              </Space>
                              <Space>
                                {managementMode ? (
                                  <Button size="small" icon={<PlusOutlined />} onClick={() => setSelectedPointId(point.id)}>
                                    任务
                                  </Button>
                                ) : null}
                                <Button type={selectedPointId === point.id ? "primary" : "default"} size="small" onClick={() => setSelectedPointId(point.id)}>
                                  查看任务
                                </Button>
                              </Space>
                            </Space>
                            {point.summary ? <Typography.Text type="secondary">{point.summary}</Typography.Text> : null}
                            {point.tasks.length ? (
                              <Space direction="vertical" size={10} style={{ width: "100%", marginTop: 10 }}>
                                {sortByOrder(point.tasks).map((task, taskIndex) => (
                                  <div
                                    key={task.id}
                                    className="learning-structure-task"
                                    draggable={managementMode}
                                    onDragStart={managementMode ? () => setDraggingNode({ level: "task", id: task.id }) : undefined}
                                    onDragEnd={managementMode ? () => setDraggingNode(null) : undefined}
                                    onDragOver={(event) => {
                                      if (!managementMode) {
                                        return;
                                      }
                                      event.preventDefault();
                                    }}
                                    onDrop={(event) => {
                                      if (!managementMode || draggingNode?.level !== "task") {
                                        return;
                                      }
                                      event.preventDefault();
                                      void reorderTask(point.id, draggingNode.id, task.id);
                                      setDraggingNode(null);
                                    }}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      padding: "8px 0 8px 14px",
                                      borderTop: taskIndex === 0 ? "none" : "1px dashed rgba(22, 71, 159, 0.08)",
                                      cursor: managementMode ? "grab" : "default",
                                      opacity: reorderBusyTaskId === task.id ? 0.65 : 1,
                                    }}
                                  >
                                    <span className="learning-structure-task-icon"><FileOutlined /></span>
                                    <Space wrap size={6} style={{ flex: 1 }}>
                                      <span className="learning-structure-task-title">{task.title}</span>
                                      <Tag color={task.taskKind === "HOMEWORK" ? "gold" : "default"}>{task.taskKind === "HOMEWORK" ? "作业" : "学习"}</Tag>
                                      <Tag>{task.taskType === "MEDIA" ? "媒体" : "测验"}</Tag>
                                      <Tag>分值 {task.maxScore}</Tag>
                                    </Space>
                                    <Button size="small" type={selectedTaskId === task.id ? "primary" : "default"} onClick={() => setSelectedTaskId(task.id)}>
                                      打开
                                    </Button>
                                  </div>
                                ))}
                              </Space>
                            ) : (
                              <Empty description="该知识点暂无任务" />
                            )}
                          </div>
                        )) : <Empty description="该单元暂无知识点" />}
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Empty description="当前课程还没有学习结构" />
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card title="任务详情" style={{ marginBottom: 16 }}>
            {selectedTask ? (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Space wrap>
                  <Tag color={selectedTask.taskKind === "HOMEWORK" ? "gold" : "default"}>{selectedTask.taskKind === "HOMEWORK" ? "作业" : "学习"}</Tag>
                  <Tag color="blue">{selectedTask.taskType === "MEDIA" ? "媒体学习" : "随堂测试"}</Tag>
                  <Tag>分值 {selectedTask.maxScore}</Tag>
                  {selectedTask.required ? <Tag color="red">必做</Tag> : <Tag>选做</Tag>}
                </Space>
                {selectedTask.taskKind === "HOMEWORK" ? (
                  <Space wrap>
                    {selectedTask.startAt ? <Tag>开始 {new Date(selectedTask.startAt).toLocaleString("zh-CN")}</Tag> : null}
                    {selectedTask.dueAt ? <Tag color="orange">截止 {new Date(selectedTask.dueAt).toLocaleString("zh-CN")}</Tag> : null}
                  </Space>
                ) : null}
                <Typography.Title level={4} style={{ margin: 0 }}>{selectedTask.title}</Typography.Title>
                {selectedTask.description ? <Typography.Paragraph>{selectedTask.description}</Typography.Paragraph> : null}
                {selectedTask.description ? <RichTextRenderer html={selectedTask.description} /> : null}
                {selectedTask.taskType === "MEDIA" ? (
                  <>
                    {selectedTask.materialType === "FILE" ? (
                      <a href={learningApi.taskFileUrl(courseId, selectedTask.id)} target="_blank" rel="noreferrer">下载学习文件</a>
                    ) : null}
                    {selectedTask.materialType === "LINK" && selectedTask.mediaUrl ? (
                      <a href={selectedTask.mediaUrl} target="_blank" rel="noreferrer">打开学习链接</a>
                    ) : null}
                    {selectedTask.materialType === "TEXT" && selectedTask.contentText ? (
                      <RichTextRenderer html={selectedTask.contentText} />
                    ) : null}
                  </>
                ) : (
                  <>
                    {selectedTask.contentText ? <RichTextRenderer html={selectedTask.contentText} /> : null}
                    {selectedTask.options.length ? (
                      <List
                        size="small"
                        bordered
                        dataSource={selectedTask.options}
                        renderItem={(option, index) => <List.Item>{String.fromCharCode(65 + index)}. {option}</List.Item>}
                      />
                    ) : null}
                    {isTeacher && selectedTask.referenceAnswer ? (
                      <Alert style={{ marginTop: 12 }} type="info" showIcon message="参考答案" description={<RichTextRenderer html={selectedTask.referenceAnswer} />} />
                    ) : null}
                  </>
                )}
              </Space>
            ) : (
              <Empty description="请选择一个任务查看详情" />
            )}
          </Card>

          {selectedTask && !isTeacher ? (
            <div id="homework" style={{ marginBottom: 16, scrollMarginTop: 92 }}>
              <Card title="提交答卷">
              <Form layout="vertical" onSubmitCapture={submitTask}>
                <Form.Item label="作答文本">
                  <RichTextEditor
                    value={answerText}
                    onChange={setAnswerText}
                    placeholder="填写你的答案或学习反馈"
                  />
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
                  {latestSubmission.answerText ? <RichTextRenderer html={latestSubmission.answerText} emptyText="无" /> : <Typography.Text>答案：{latestSubmission.fileName || "无"}</Typography.Text>}
                  {latestSubmission.score !== null ? <Tag color="blue">评分 {latestSubmission.score}</Tag> : <Tag>待评分</Tag>}
                  {latestSubmission.feedback ? <RichTextRenderer html={latestSubmission.feedback} className="muted" /> : null}
                </Space>
              ) : <Empty description="尚无提交" />}
              </Card>
            </div>
          ) : null}

          {selectedTask && managementMode ? (
            <div id="homework" style={{ marginBottom: 16, scrollMarginTop: 92 }}>
              <Card title="答卷批阅">
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
                        {submission.answerText ? <RichTextRenderer html={submission.answerText} /> : null}
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
            </div>
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
    </CourseShell>
  );
}

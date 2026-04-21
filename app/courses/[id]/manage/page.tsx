"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BellOutlined, BookOutlined, BulbOutlined, FileOutlined, ReadOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Collapse, Divider, Empty, Form, Input, InputNumber, List, Row, Select, Space, Tabs, Tag, Typography } from "antd";
import { announcementsApi } from "@/lib/api/announcements";
import { coursesApi } from "@/lib/api/courses";
import { experimentsApi } from "@/lib/api/experiments";
import { learningApi } from "@/lib/api/learning";
import { resourcesApi } from "@/lib/api/resources";
import type { CourseAnnouncement, CourseDetail, CourseResource, CourseLearningOverview, CourseLearningDetail, LearningTaskKind, LearningTaskType, ResourceType } from "@/lib/api/types";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { CourseShell } from "@/components/course-shell";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichTextRenderer } from "@/components/rich-text-renderer";
import { useAuth } from "@/lib/auth/auth-context";

const taskTypeOptions: Array<{ label: string; value: LearningTaskType }> = [
  { label: "媒体学习", value: "MEDIA" },
  { label: "随堂测试", value: "QUIZ" },
];

const taskKindOptions: Array<{ label: string; value: LearningTaskKind }> = [
  { label: "学习任务", value: "LEARNING" },
  { label: "作业", value: "HOMEWORK" },
];

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
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [creatingExperiment, setCreatingExperiment] = useState(false);
  const [experimentTitle, setExperimentTitle] = useState('');
  const [experimentDescription, setExperimentDescription] = useState('');
  const [experimentDueAt, setExperimentDueAt] = useState('');
  const [submittingExperiment, setSubmittingExperiment] = useState(false);
  const [creatingResource, setCreatingResource] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('FILE');
  const [resourceCategory, setResourceCategory] = useState('');
  const [resourceExternalUrl, setResourceExternalUrl] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [submittingResource, setSubmittingResource] = useState(false);
  const [learningDetail, setLearningDetail] = useState<CourseLearningDetail | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [unitTitle, setUnitTitle] = useState('');
  const [unitDescription, setUnitDescription] = useState('');
  const [unitPublished, setUnitPublished] = useState(true);
  const [pointTitle, setPointTitle] = useState('');
  const [pointSummary, setPointSummary] = useState('');
  const [pointEstimatedMinutes, setPointEstimatedMinutes] = useState<number | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState<LearningTaskType>('MEDIA');
  const [taskKind, setTaskKind] = useState<LearningTaskKind>('LEARNING');
  const [taskMaxScore, setTaskMaxScore] = useState<number | null>(10);
  const [creatingUnit, setCreatingUnit] = useState(true);
  const [creatingPoint, setCreatingPoint] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [submittingUnit, setSubmittingUnit] = useState(false);
  const [submittingPoint, setSubmittingPoint] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);

  const loadData = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [detail, announcementData, resourceData, overviewData, learningDetailData] = await Promise.all([
        coursesApi.detail(courseId),
        announcementsApi.list(courseId),
        resourcesApi.list(courseId),
        learningApi.overview(courseId),
        learningApi.detail(courseId),
      ]);
      setCourse(detail);
      setAnnouncements(announcementData.items);
      setResources(resourceData.items);
      setOverview(overviewData);
      setLearningDetail(learningDetailData);

      // 设置默认选中的单元
      if (learningDetailData?.units?.length && !selectedUnitId) {
        setSelectedUnitId(learningDetailData.units[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载管理数据失败");
      setCourse(null);
      setAnnouncements([]);
      setResources([]);
      setOverview(null);
      setLearningDetail(null);
    } finally {
      setBusy(false);
    }
  }, [courseId, selectedUnitId]);

  const handleCreateAnnouncement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingAnnouncement(true);
    setError(null);
    try {
      await announcementsApi.create(courseId, { title: announcementTitle, content: announcementContent });
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setCreatingAnnouncement(false);
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "发布公告失败");
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleCreateExperiment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingExperiment(true);
    setError(null);
    try {
      await experimentsApi.create(courseId, {
        title: experimentTitle,
        description: experimentDescription,
        dueAt: experimentDueAt ? new Date(experimentDueAt).toISOString() : null,
      });
      setExperimentTitle('');
      setExperimentDescription('');
      setExperimentDueAt('');
      setCreatingExperiment(false);
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "发布实验失败");
    } finally {
      setSubmittingExperiment(false);
    }
  };

  const selectedUnit = learningDetail?.units.find(unit => unit.id === selectedUnitId) ?? null;
  const selectedPoint = selectedUnit?.points.find(point => point.id === selectedPointId) ?? null;

  const handleCreateResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingResource(true);
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
      setCreatingResource(false);
      await loadData();
    } catch (createError) {
      console.error('Upload resource error:', createError);
      setError(createError instanceof Error ? createError.message : "上传资源失败");
    } finally {
      setSubmittingResource(false);
    }
  };

  const handleCreateUnit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingUnit(true);
    setError(null);
    try {
      await learningApi.createUnit(courseId, {
        title: unitTitle,
        description: unitDescription,
        sortOrder: learningDetail?.units?.length ? Math.max(...learningDetail.units.map(u => u.sortOrder)) + 10 : 10,
        published: unitPublished,
      });
      setUnitTitle('');
      setUnitDescription('');
      setUnitPublished(true);
      // 创建成功后，切换到知识点标签页
      setCreatingUnit(false);
      setCreatingPoint(true);
      await loadData();
      // 加载数据后，选择最后一个单元（假设是新创建的）
      if (learningDetail?.units?.length) {
        const lastUnit = learningDetail.units[learningDetail.units.length - 1];
        setSelectedUnitId(lastUnit.id);
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建学习单元失败");
    } finally {
      setSubmittingUnit(false);
    }
  };

  const handleCreatePoint = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUnit) {
      setError("请先选择学习单元");
      return;
    }
    setSubmittingPoint(true);
    setError(null);
    try {
      await learningApi.createPoint(courseId, selectedUnit.id, {
        title: pointTitle,
        summary: pointSummary,
        estimatedMinutes: pointEstimatedMinutes ?? undefined,
        sortOrder: selectedUnit.points.length ? Math.max(...selectedUnit.points.map(p => p.sortOrder)) + 10 : 10,
      });
      setPointTitle('');
      setPointSummary('');
      setPointEstimatedMinutes(null);
      // 创建成功后，切换到任务标签页
      setCreatingPoint(false);
      setCreatingTask(true);
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建知识点失败");
    } finally {
      setSubmittingPoint(false);
    }
  };

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPoint) {
      setError("请先选择知识点");
      return;
    }
    setSubmittingTask(true);
    setError(null);
    try {
      await learningApi.createTask(courseId, selectedPoint.id, {
        title: taskTitle,
        description: taskDescription,
        taskType,
        taskKind,
        maxScore: taskMaxScore ?? undefined,
        sortOrder: selectedPoint.tasks.length ? Math.max(...selectedPoint.tasks.map(t => t.sortOrder)) + 10 : 10,
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskKind('LEARNING');
      setTaskMaxScore(10);
      // 任务创建成功后，保持在任务标签页，用户可以继续创建
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建学习任务失败");
    } finally {
      setSubmittingTask(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      void loadData();
    }
  }, [loading, user, loadData]);

  if (loading || !user) {
    return <AuthLoadingState />;
  }

  // 等待课程数据加载
  if (!course) {
    return <AuthLoadingState />;
  }

  // 检查用户是否是课程所有者或管理员
  if (course.owner.id !== user.id && user.role !== "ADMIN") {
    return (
      <CourseShell title={course?.title || "课程管理"} subtitle="当前账号没有管理权限。" courseId={courseId}>
        <Card>
          <Empty description="仅课程创建者可管理课程" />
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
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {creatingAnnouncement ? (
                    <Card title="发布通知">
                      <Form layout="vertical" onSubmitCapture={handleCreateAnnouncement}>
                        <Form.Item label="公告标题" required>
                          <Input value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} required />
                        </Form.Item>
                        <Form.Item label="公告内容" required>
                          <RichTextEditor
                            value={announcementContent}
                            onChange={setAnnouncementContent}
                            placeholder="例如：本周实验要求、课堂提醒、材料更新"
                          />
                        </Form.Item>
                        <Space>
                          <Button type="primary" htmlType="submit" loading={submittingAnnouncement}>
                            发布通知
                          </Button>
                          <Button onClick={() => setCreatingAnnouncement(false)}>
                            取消
                          </Button>
                        </Space>
                      </Form>
                    </Card>
                  ) : (
                    <Button type="primary" onClick={() => setCreatingAnnouncement(true)}>
                      发布通知
                    </Button>
                  )}
                  <List
                    dataSource={announcements}
                    locale={{ emptyText: "暂无通知" }}
                    renderItem={(item) => (
                      <List.Item extra={<Link href={`/courses/${courseId}`}>查看通知页</Link>}>
                        <List.Item.Meta
                          title={<Space><BellOutlined />{item.title}</Space>}
                          description={<RichTextRenderer html={item.content} emptyText="暂无内容" className="muted" />}
                        />
                      </List.Item>
                    )}
                  />
                </Space>
              ),
            },
            {
              key: "experiments",
              label: "实验管理",
              children: (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {creatingExperiment ? (
                    <Card title="发布实验">
                      <Form layout="vertical" onSubmitCapture={handleCreateExperiment}>
                        <Form.Item label="实验标题" required>
                          <Input value={experimentTitle} onChange={(e) => setExperimentTitle(e.target.value)} required />
                        </Form.Item>
                        <Form.Item label="实验描述">
                          <RichTextEditor
                            value={experimentDescription}
                            onChange={setExperimentDescription}
                            placeholder="说明实验目标、提交要求或评分标准"
                          />
                        </Form.Item>
                        <Row gutter={12}>
                          <Col xs={24} md={14}>
                            <Form.Item label="截止时间">
                              <Input type="datetime-local" value={experimentDueAt} onChange={(e) => setExperimentDueAt(e.target.value)} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={10}>
                            <Form.Item label=" " colon={false}>
                              <Button type="primary" htmlType="submit" loading={submittingExperiment} block>
                                发布实验
                              </Button>
                            </Form.Item>
                          </Col>
                        </Row>
                        <Space>
                          <Button onClick={() => setCreatingExperiment(false)}>
                            取消
                          </Button>
                        </Space>
                      </Form>
                    </Card>
                  ) : (
                    <Button type="primary" onClick={() => setCreatingExperiment(true)}>
                      发布实验
                    </Button>
                  )}
                  <List
                    dataSource={course?.experiments || []}
                    locale={{ emptyText: "暂无实验" }}
                    renderItem={(item) => (
                      <List.Item extra={<Link href={`/courses/${courseId}/experiments`}>查看实验页</Link>}>
                        <List.Item.Meta
                          title={<Space><ReadOutlined />{item.title}</Space>}
                          description={<RichTextRenderer html={item.description} emptyText="暂无描述" className="muted" />}
                        />
                      </List.Item>
                    )}
                  />
                </Space>
              ),
            },
            {
              key: "resources",
              label: "资源管理",
              children: (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {creatingResource ? (
                    <Card title="上传资源">
                      <Form layout="vertical" onSubmitCapture={handleCreateResource}>
                        <Form.Item label="资源名称" required>
                          <Input value={resourceName} onChange={(e) => setResourceName(e.target.value)} required />
                        </Form.Item>
                        <Row gutter={12}>
                          <Col xs={24} md={12}>
                            <Form.Item label="资源类型" required>
                              <Select
                                value={resourceType}
                                options={[
                                  { label: "文件", value: "FILE" },
                                  { label: "视频链接", value: "VIDEO" },
                                  { label: "参考链接", value: "LINK" },
                                ]}
                                onChange={(value) => setResourceType(value)}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label="分类">
                              <Input value={resourceCategory} onChange={(e) => setResourceCategory(e.target.value)} placeholder="如：课件/视频/参考资料" />
                            </Form.Item>
                          </Col>
                        </Row>
                        {resourceType === "FILE" ? (
                          <Form.Item label="上传文件" required>
                            <Input type="file" onChange={(e) => setResourceFile(e.target.files?.[0] ?? null)} required />
                          </Form.Item>
                        ) : (
                          <Form.Item label="外部链接" required>
                            <Input value={resourceExternalUrl} onChange={(e) => setResourceExternalUrl(e.target.value)} placeholder="https://" required />
                          </Form.Item>
                        )}
                        <Space>
                          <Button type="primary" htmlType="submit" loading={submittingResource}>
                            上传资源
                          </Button>
                          <Button onClick={() => setCreatingResource(false)}>
                            取消
                          </Button>
                        </Space>
                      </Form>
                    </Card>
                  ) : (
                    <Button type="primary" onClick={() => setCreatingResource(true)}>
                      上传资源
                    </Button>
                  )}
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
                </Space>
              ),
            },
            {
              key: "learning",
              label: "学习管理",
              children: (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}><Card><Typography.Text type="secondary">单元</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview?.unitCount ?? 0}</Typography.Title></Card></Col>
                    <Col xs={24} md={8}><Card><Typography.Text type="secondary">知识点</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview?.pointCount ?? 0}</Typography.Title></Card></Col>
                    <Col xs={24} md={8}><Card><Typography.Text type="secondary">任务</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview?.taskCount ?? 0}</Typography.Title></Card></Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={16}>
                      <Card title="创建教学内容">
                        <Tabs
                          activeKey={creatingUnit ? "unit" : creatingPoint ? "point" : creatingTask ? "task" : "unit"}
                          onChange={(key) => {
                            if (key === "unit") {
                              setCreatingUnit(true);
                              setCreatingPoint(false);
                              setCreatingTask(false);
                            } else if (key === "point") {
                              if (!selectedUnit) {
                                setError("请先选择或创建一个学习单元");
                                return;
                              }
                              setCreatingUnit(false);
                              setCreatingPoint(true);
                              setCreatingTask(false);
                            } else if (key === "task") {
                              if (!selectedPoint) {
                                setError("请先选择或创建一个知识点");
                                return;
                              }
                              setCreatingUnit(false);
                              setCreatingPoint(false);
                              setCreatingTask(true);
                            }
                          }}
                          items={[
                            {
                              key: "unit",
                              label: "学习单元",
                              children: (
                                <Form layout="vertical" onSubmitCapture={handleCreateUnit}>
                                  <Form.Item label="学习单元标题" required>
                                    <Input value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} required />
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
                                        <Button type="primary" htmlType="submit" loading={submittingUnit} block>
                                          创建单元
                                        </Button>
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                </Form>
                              ),
                            },
                            {
                              key: "point",
                              label: "知识点",
                              disabled: !selectedUnit,
                              children: (
                                <Form layout="vertical" onSubmitCapture={handleCreatePoint}>
                                  <Form.Item label="当前单元" required>
                                    <Space wrap>
                                      <Tag color="blue">{selectedUnit?.title ?? "请先选择学习单元"}</Tag>
                                      {selectedUnit?.published ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag>}
                                    </Space>
                                  </Form.Item>
                                  <Form.Item label="知识点标题" required>
                                    <Input value={pointTitle} onChange={(e) => setPointTitle(e.target.value)} required />
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
                                        <Button block htmlType="submit" loading={submittingPoint}>
                                          创建知识点
                                        </Button>
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                </Form>
                              ),
                            },
                            {
                              key: "task",
                              label: "学习任务",
                              disabled: !selectedPoint,
                              children: (
                                <Form layout="vertical" onSubmitCapture={handleCreateTask}>
                                  <Form.Item label="当前知识点" required>
                                    <Space wrap>
                                      <Tag color="blue">{selectedPoint?.title ?? "请先选择知识点"}</Tag>
                                      <Tag>{selectedUnit?.title ?? "无所属单元"}</Tag>
                                    </Space>
                                  </Form.Item>
                                  <Form.Item label="任务标题" required>
                                    <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
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
                                  <Button type="primary" htmlType="submit" loading={submittingTask}>
                                    创建任务
                                  </Button>
                                </Form>
                              ),
                            },
                          ]}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card title="当前选择" size="small">
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                          <div>
                            <Typography.Text type="secondary" style={{ fontSize: "0.85em" }}>学习单元</Typography.Text>
                            <div>
                              {selectedUnit ? (
                                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                                  <Typography.Text strong>{selectedUnit.title}</Typography.Text>
                                  <Space wrap>
                                    {selectedUnit.published ? <Tag color="green" style={{ fontSize: '0.85em' }}>已发布</Tag> : <Tag style={{ fontSize: '0.85em' }}>草稿</Tag>}
                                    <Tag style={{ fontSize: '0.85em' }}>{selectedUnit.points.length}个知识点</Tag>
                                  </Space>
                                  <Button size="small" onClick={() => setCreatingPoint(true)} disabled={!selectedUnit}>
                                    在此单元创建知识点
                                  </Button>
                                </Space>
                              ) : (
                                <Typography.Text type="secondary">未选择</Typography.Text>
                              )}
                            </div>
                          </div>
                          <div>
                            <Typography.Text type="secondary" style={{ fontSize: "0.85em" }}>知识点</Typography.Text>
                            <div>
                              {selectedPoint ? (
                                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                                  <Typography.Text strong>{selectedPoint.title}</Typography.Text>
                                  <Space wrap>
                                    <Tag style={{ fontSize: '0.85em' }}>{selectedPoint.estimatedMinutes ? `${selectedPoint.estimatedMinutes}分钟` : "未设时长"}</Tag>
                                    <Tag style={{ fontSize: '0.85em' }}>{selectedPoint.tasks.length}个任务</Tag>
                                  </Space>
                                  <Button size="small" onClick={() => setCreatingTask(true)} disabled={!selectedPoint}>
                                    在此知识点创建任务
                                  </Button>
                                </Space>
                              ) : (
                                <Typography.Text type="secondary">未选择</Typography.Text>
                              )}
                            </div>
                          </div>
                          <div>
                            <Typography.Text type="secondary" style={{ fontSize: "0.85em" }}>快速导航</Typography.Text>
                            <Space direction="vertical" size={4} style={{ width: "100%" }}>
                              <Button size="small" type="link" onClick={() => setCreatingUnit(true)} block style={{ textAlign: "left", paddingLeft: 0 }}>
                                + 创建新单元
                              </Button>
                              <Button size="small" type="link" onClick={() => setCreatingPoint(true)} disabled={!selectedUnit} block style={{ textAlign: "left", paddingLeft: 0 }}>
                                + 创建新知识点
                              </Button>
                              <Button size="small" type="link" onClick={() => setCreatingTask(true)} disabled={!selectedPoint} block style={{ textAlign: "left", paddingLeft: 0 }}>
                                + 创建新任务
                              </Button>
                            </Space>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  </Row>

                  {learningDetail?.units?.length ? (
                    <Card title="课程结构">
                      <Space direction="vertical" size={16} style={{ width: "100%" }}>
                        <Typography.Text type="secondary">
                          课程内容按单元、知识点、任务三级结构组织。点击单元查看详情。
                        </Typography.Text>
                        <Collapse ghost>
                          {learningDetail.units.map((unit) => (
                            <Collapse.Panel
                              key={unit.id}
                              header={
                                <Space
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUnitId(unit.id);
                                    setSelectedPointId(null);
                                    setCreatingPoint(true);
                                  }}
                                  style={{ cursor: "pointer", width: "100%" }}
                                >
                                  <BookOutlined />
                                  <span>{unit.title}</span>
                                  {unit.published ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag>}
                                  <Tag>排序 {unit.sortOrder}</Tag>
                                </Space>
                              }
                            >
                              <Space direction="vertical" size={12} style={{ width: "100%", paddingLeft: 16 }}>
                                <Typography.Text type="secondary">{unit.description ? <RichTextRenderer html={unit.description} className="muted" /> : "暂无单元简介"}</Typography.Text>
                                {unit.points.length ? (
                                  <>
                                    <Divider>知识点</Divider>
                                    {unit.points.map((point) => (
                                      <Card size="small" key={point.id}>
                                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                          <Space
                                            onClick={() => {
                                              setSelectedUnitId(unit.id);
                                              setSelectedPointId(point.id);
                                              setCreatingTask(true);
                                            }}
                                            style={{ cursor: "pointer" }}
                                          >
                                            <BulbOutlined />
                                            <strong>{point.title}</strong>
                                            {point.estimatedMinutes ? <Tag>预计 {point.estimatedMinutes} 分钟</Tag> : null}
                                            <Tag>排序 {point.sortOrder}</Tag>
                                          </Space>
                                          <Typography.Text type="secondary">{point.summary ? <RichTextRenderer html={point.summary} className="muted" /> : "暂无知识点说明"}</Typography.Text>
                                          {point.tasks.length ? (
                                            <>
                                              <Divider style={{ marginTop: 8, marginBottom: 8 }}>任务</Divider>
                                              {point.tasks.map((task) => (
                                                <Card size="small" key={task.id}>
                                                  <Space direction="vertical" size={4} style={{ width: "100%" }}>
                                                    <Space>
                                                      <FileOutlined />
                                                      <span>{task.title}</span>
                                                      <Tag>{task.taskKind === 'HOMEWORK' ? '作业' : '学习任务'}</Tag>
                                                      <Tag>{task.taskType === 'QUIZ' ? '随堂测试' : '媒体学习'}</Tag>
                                                      {task.maxScore ? <Tag>分值 {task.maxScore}</Tag> : null}
                                                    </Space>
                                                    <Typography.Text type="secondary">{task.description ? <RichTextRenderer html={task.description} className="muted" /> : "暂无任务说明"}</Typography.Text>
                                                  </Space>
                                                </Card>
                                              ))}
                                            </>
                                          ) : (
                                            <Typography.Text type="secondary">暂无任务</Typography.Text>
                                          )}
                                        </Space>
                                      </Card>
                                    ))}
                                  </>
                                ) : (
                                  <Typography.Text type="secondary">暂无知识点</Typography.Text>
                                )}
                              </Space>
                            </Collapse.Panel>
                          ))}
                        </Collapse>
                      </Space>
                    </Card>
                  ) : (
                    <Card>
                      <Empty description="暂无学习单元，请先创建学习单元" />
                    </Card>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </CourseShell>
  );
}

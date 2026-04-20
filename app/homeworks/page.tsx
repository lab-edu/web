"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Empty, List, Space, Spin, Tag, Typography } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { PersonalShell } from "@/components/personal-shell";
import { RefreshButton } from "@/components/refresh-button";
import { learningApi } from "@/lib/api/learning";
import type { CourseHomeworkItem } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

function statusTag(status: CourseHomeworkItem["status"]) {
  if (status === "SUBMITTED") {
    return <Tag color="green">已提交</Tag>;
  }
  if (status === "OVERDUE") {
    return <Tag color="red">已截止</Tag>;
  }
  if (status === "NOT_STARTED") {
    return <Tag color="blue">未开始</Tag>;
  }
  return <Tag color="orange">进行中</Tag>;
}

function formatRemaining(remainingSeconds: number | null) {
  if (remainingSeconds === null) {
    return "无截止时间";
  }
  const hours = Math.floor(remainingSeconds / 3600);
  if (hours < 24) {
    return `剩余 ${hours} 小时`;
  }
  const days = Math.floor(hours / 24);
  return `剩余 ${days} 天`;
}

export default function HomeworkCenterPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<CourseHomeworkItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = user?.role === "TEACHER";

  const loadHomeworks = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await learningApi.myHomeworksAllCourses();
      setItems(data.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载作业中心失败");
      setItems([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      void loadHomeworks();
    }
  }, [loading, user]);

  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; items: CourseHomeworkItem[] }>();
    for (const item of items) {
      const current = map.get(item.courseId);
      if (current) {
        current.items.push(item);
      } else {
        map.set(item.courseId, { title: item.courseTitle, items: [item] });
      }
    }
    return Array.from(map.entries());
  }, [items]);

  if (loading || !user) {
    return <AuthLoadingState />;
  }

  return (
    <PersonalShell
      title="作业中心"
      subtitle="统一查看所有课程作业进度、提交与批阅状态。"
      actions={(
        <RefreshButton onClick={() => void loadHomeworks()} loading={busy} />
      )}
    >
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

      {busy ? (
        <Spin />
      ) : grouped.length ? (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {grouped.map(([courseId, group]) => (
            <Card
              key={courseId}
              title={group.title}
              extra={<Link href={`/courses/${courseId}/learning`}>进入课程学习</Link>}
            >
              <List
                dataSource={group.items}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Link key="open" href={`/courses/${item.courseId}/learning`}>
                        <Button type="primary" size="small">打开</Button>
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      title={(
                        <Space wrap>
                          <Typography.Text strong>{item.taskTitle}</Typography.Text>
                          {statusTag(item.status)}
                          <Tag icon={<ClockCircleOutlined />}>{formatRemaining(item.remainingSeconds)}</Tag>
                        </Space>
                      )}
                      description={(
                        <Space wrap>
                          {item.startAt ? <Typography.Text type="secondary">开始：{new Date(item.startAt).toLocaleString("zh-CN")}</Typography.Text> : null}
                          {item.dueAt ? <Typography.Text type="secondary">截止：{new Date(item.dueAt).toLocaleString("zh-CN")}</Typography.Text> : null}
                          {item.latestScore !== null ? <Tag color="blue">得分 {item.latestScore}</Tag> : null}
                          {isTeacher ? <Tag>提交 {item.submittedCount}/{item.totalStudentCount}</Tag> : null}
                        </Space>
                      )}
                    />
                  </List.Item>
                )}
              />
            </Card>
          ))}
        </Space>
      ) : (
        <Empty description="暂无作业" />
      )}
    </PersonalShell>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Empty, Row, Space, Spin, Statistic, Typography } from "antd";
import { AppstoreOutlined, BookOutlined, MailOutlined, ReadOutlined, ReloadOutlined } from "@ant-design/icons";
import { PersonalShell } from "@/components/personal-shell";
import { coursesApi } from "@/lib/api/courses";
import { learningApi } from "@/lib/api/learning";
import type { CourseSummary, CourseHomeworkItem } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [homeworks, setHomeworks] = useState<CourseHomeworkItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setBusy(true);
    setError(null);
    try {
      const [courseData, homeworkData] = await Promise.all([
        coursesApi.list(),
        learningApi.myHomeworksAllCourses(),
      ]);
      setCourses(courseData.items);
      setHomeworks(homeworkData.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载首页数据失败");
      setCourses([]);
      setHomeworks([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      void loadData();
    }
  }, [loading, user]);

  const overdueCount = useMemo(
    () => homeworks.filter((item) => item.status === "OVERDUE").length,
    [homeworks],
  );

  if (loading || !user) {
    return (
      <main className="auth-page">
        <Spin size="large" tip="正在同步登录状态..." />
      </main>
    );
  }

  return (
    <PersonalShell
      title="首页"
      subtitle="个人空间总览：课程、作业与快捷入口。"
      actions={(
        <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
          刷新
        </Button>
      )}
    >
      {error ? <Alert style={{ marginBottom: 12 }} type="error" message={error} showIcon /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="课程总数" value={courses.length} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="作业任务" value={homeworks.length} prefix={<ReadOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="已截止任务" value={overdueCount} prefix={<BookOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={14}>
          <Card title="最近课程" extra={<Link href="/courses">查看全部</Link>}>
            {busy ? (
              <Spin />
            ) : courses.length === 0 ? (
              <Empty description="暂无课程" />
            ) : (
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                {courses.slice(0, 5).map((course) => (
                  <Card
                    key={course.id}
                    size="small"
                    title={course.title}
                    extra={(
                      <Link href={`/courses/${course.id}`} target="_blank" rel="noreferrer">
                        打开课程空间
                      </Link>
                    )}
                  >
                    <Typography.Text type="secondary">{course.description || "暂无描述"}</Typography.Text>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card title="快捷入口">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Link href="/courses">
                <Button block icon={<AppstoreOutlined />}>
                  课程列表
                </Button>
              </Link>
              <Link href="/homeworks">
                <Button block icon={<ReadOutlined />}>
                  作业中心
                </Button>
              </Link>
              <Link href="/messages">
                <Button block icon={<MailOutlined />}>
                  消息中心
                </Button>
              </Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </PersonalShell>
  );
}

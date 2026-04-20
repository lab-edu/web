"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import {
  BellOutlined,
  BookOutlined,
  FileTextOutlined,
  LogoutOutlined,
  ReadOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import { useAuth } from "@/lib/auth/auth-context";

const { Header, Content, Sider } = Layout;

type CourseShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  courseId?: string;
};

function resolveCourseMenuKey(pathname: string) {
  if (pathname.endsWith("/learning")) {
    return "content";
  }
  if (pathname.endsWith("/experiments") || pathname.startsWith("/experiments/")) {
    return "experiments";
  }
  if (pathname.endsWith("/resources")) {
    return "resources";
  }
  if (pathname.endsWith("/manage")) {
    return "manage";
  }
  return "home";
}

export function CourseShell({ title, subtitle, actions, children, courseId }: CourseShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const selectedMenuKey = resolveCourseMenuKey(pathname);

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const hasCourse = Boolean(courseId);
  const base = hasCourse ? `/courses/${courseId}` : "/courses";
  const showManage = user?.role === "TEACHER" && hasCourse;

  return (
    <Layout className="platform-layout">
      <Sider width={240} className="platform-sider course-sider" breakpoint="lg" collapsedWidth={0}>
        <div className="platform-brand course-brand">
          <BookOutlined />
          <span>课程空间</span>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          items={[
            {
              key: "home",
              icon: <BellOutlined />,
              label: hasCourse ? <Link href={base}>课程通知</Link> : "课程通知",
            },
            {
              key: "experiments",
              icon: <ReadOutlined />,
              label: hasCourse ? <Link href={`${base}/experiments`}>实验列表</Link> : "实验列表",
              disabled: !hasCourse,
            },
            {
              key: "content",
              icon: <BookOutlined />,
              label: hasCourse ? <Link href={`${base}/learning`}>课程内容</Link> : "课程内容",
              disabled: !hasCourse,
            },
            {
              key: "resources",
              icon: <FileTextOutlined />,
              label: hasCourse ? <Link href={`${base}/resources`}>课程资源</Link> : "课程资源",
              disabled: !hasCourse,
            },
            {
              key: "manage",
              icon: <SettingOutlined />,
              label: hasCourse ? <Link href={`${base}/manage`}>管理</Link> : "管理",
              disabled: !showManage,
            },
          ]}
        />
      </Sider>

      <Layout>
        <Header className="platform-header">
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
            {subtitle ? <Typography.Text type="secondary">{subtitle}</Typography.Text> : null}
          </div>

          <Space size={16}>
            {actions}
            {user ? (
              <Space size={10}>
                <Avatar icon={<UserOutlined />} />
                <div className="platform-user-meta">
                  <strong>{user.displayName || user.username}</strong>
                  <span>{user.role}</span>
                </div>
                <Button icon={<LogoutOutlined />} onClick={onLogout}>
                  退出
                </Button>
              </Space>
            ) : null}
          </Space>
        </Header>

        <Content className="platform-content">{children}</Content>
      </Layout>
    </Layout>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import {
  AppstoreOutlined,
  BookOutlined,
  FileTextOutlined,
  ReadOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import { useAuth } from "@/lib/auth/auth-context";

const { Header, Content, Sider } = Layout;

type PlatformShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PlatformShell({ title, subtitle, actions, children }: PlatformShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const selectedMenuKey = pathname.startsWith("/experiments") ? "courses" : pathname.split("/")[1] || "courses";

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <Layout className="platform-layout">
      <Sider width={240} className="platform-sider" breakpoint="lg" collapsedWidth={0}>
        <div className="platform-brand">
          <BookOutlined />
          <span>Lab Edu</span>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          items={[
            {
              key: "courses",
              icon: <AppstoreOutlined />,
              label: <Link href="/courses">课程中心</Link>,
            },
            {
              key: "homeworks",
              icon: <ReadOutlined />,
              label: <Link href="/homeworks">作业中心</Link>,
            },
            {
              key: "announcement",
              icon: <FileTextOutlined />,
              label: "课堂公告",
              disabled: true,
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

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import {
  AppstoreOutlined,
  HomeOutlined,
  LogoutOutlined,
  MailOutlined,
  ReadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import { useAuth } from "@/lib/auth/auth-context";

const { Header, Content, Sider } = Layout;

type PersonalShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

function resolvePersonalMenuKey(pathname: string) {
  if (pathname.startsWith("/dashboard")) {
    return "dashboard";
  }
  if (pathname.startsWith("/courses") || pathname.startsWith("/experiments")) {
    return "courses";
  }
  if (pathname.startsWith("/homeworks")) {
    return "homeworks";
  }
  if (pathname.startsWith("/messages")) {
    return "messages";
  }
  return "dashboard";
}

export function PersonalShell({ title, subtitle, actions, children }: PersonalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const selectedMenuKey = resolvePersonalMenuKey(pathname);

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <Layout className="platform-layout">
      <Sider width={240} className="platform-sider" breakpoint="lg" collapsedWidth={0}>
        <div className="platform-brand">
          <HomeOutlined />
          <span>个人空间</span>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          items={[
            {
              key: "dashboard",
              icon: <HomeOutlined />,
              label: <Link href="/dashboard">首页</Link>,
            },
            {
              key: "courses",
              icon: <AppstoreOutlined />,
              label: <Link href="/courses">课程</Link>,
            },
            {
              key: "homeworks",
              icon: <ReadOutlined />,
              label: <Link href="/homeworks">作业</Link>,
            },
            {
              key: "messages",
              icon: <MailOutlined />,
              label: <Link href="/messages">消息</Link>,
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

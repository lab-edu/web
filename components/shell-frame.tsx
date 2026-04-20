"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "@/lib/auth/auth-context";

const { Header, Content, Sider } = Layout;

type ShellFrameProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  brandIcon: ReactNode;
  brandText: string;
  brandHref?: string;
  selectedMenuKey: string;
  menuItems: MenuProps["items"];
  siderClassName?: string;
  brandClassName?: string;
};

export function ShellFrame({
  title,
  subtitle,
  actions,
  children,
  brandIcon,
  brandText,
  brandHref,
  selectedMenuKey,
  menuItems,
  siderClassName,
  brandClassName,
}: ShellFrameProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const brandContent = (
    <>
      {brandIcon}
      <span>{brandText}</span>
    </>
  );

  return (
    <Layout className="platform-layout">
      <Sider width={240} className={siderClassName ? `platform-sider ${siderClassName}` : "platform-sider"} breakpoint="lg" collapsedWidth={0}>
        <div className={brandClassName ? `platform-brand ${brandClassName}` : "platform-brand"}>
          {brandHref ? <Link href={brandHref}>{brandContent}</Link> : brandContent}
        </div>

        <Menu mode="inline" selectedKeys={[selectedMenuKey]} items={menuItems} />
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
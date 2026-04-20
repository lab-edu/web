"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  AppstoreOutlined,
  HomeOutlined,
  MailOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { ShellFrame } from "@/components/shell-frame";

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

  const selectedMenuKey = resolvePersonalMenuKey(pathname);

  return (
    <ShellFrame
      title={title}
      subtitle={subtitle}
      actions={actions}
      brandIcon={<HomeOutlined />}
      brandText="个人空间"
      selectedMenuKey={selectedMenuKey}
      menuItems={[
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
    >
      {children}
    </ShellFrame>
  );
}

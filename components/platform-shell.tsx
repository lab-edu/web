"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  AppstoreOutlined,
  BookOutlined,
  FileTextOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { ShellFrame } from "@/components/shell-frame";

type PlatformShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PlatformShell({ title, subtitle, actions, children }: PlatformShellProps) {
  const pathname = usePathname();

  const selectedMenuKey = pathname.startsWith("/experiments") ? "courses" : pathname.split("/")[1] || "courses";

  return (
    <ShellFrame
      title={title}
      subtitle={subtitle}
      actions={actions}
      brandIcon={<BookOutlined />}
      brandText="Lab Edu"
      selectedMenuKey={selectedMenuKey}
      menuItems={[
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
    >
      {children}
    </ShellFrame>
  );
}

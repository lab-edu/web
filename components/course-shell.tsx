"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  BellOutlined,
  BookOutlined,
  FileTextOutlined,
  ReadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { ShellFrame } from "@/components/shell-frame";
import { useAuth } from "@/lib/auth/auth-context";

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
  const { user } = useAuth();

  const selectedMenuKey = resolveCourseMenuKey(pathname);

  const hasCourse = Boolean(courseId);
  const base = hasCourse ? `/courses/${courseId}` : "/courses";
  const showManage = user?.role === "TEACHER" && hasCourse;
  const menuItems = [
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
    ...(showManage
      ? [
          {
            key: "manage",
            icon: <SettingOutlined />,
            label: <Link href={`${base}/manage`}>管理</Link>,
          },
        ]
      : []),
  ];

  return (
    <ShellFrame
      title={title}
      subtitle={subtitle}
      actions={actions}
      brandIcon={<BookOutlined />}
      brandText="课程空间"
      brandClassName="course-brand"
      siderClassName="course-sider"
      selectedMenuKey={selectedMenuKey}
      menuItems={menuItems}
    >
      {children}
    </ShellFrame>
  );
}

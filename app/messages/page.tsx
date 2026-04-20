"use client";

import { useEffect } from "react";
import { BellOutlined } from "@ant-design/icons";
import { Card, Empty, Space, Spin, Tag, Typography } from "antd";
import { PersonalShell } from "@/components/personal-shell";
import { useAuth } from "@/lib/auth/auth-context";

export default function MessagesPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Reserved for future pull-mode notifications integration.
  }, []);

  if (loading || !user) {
    return (
      <main className="auth-page">
        <Spin size="large" tip="正在同步登录状态..." />
      </main>
    );
  }

  return (
    <PersonalShell title="消息" subtitle="系统通知、课程提醒与作业动态将汇总在这里。">
      <Card>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Space>
            <BellOutlined />
            <Typography.Text strong>消息中心已就绪</Typography.Text>
            <Tag color="blue">预览版</Tag>
          </Space>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            当前版本已完成个人空间入口与页面结构，后续可直接接入公告、作业提醒与系统消息接口。
          </Typography.Paragraph>
          <Empty description="暂时没有新消息" />
        </Space>
      </Card>
    </PersonalShell>
  );
}

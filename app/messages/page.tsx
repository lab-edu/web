"use client";

import { useCallback, useEffect, useState } from "react";
import { BellOutlined } from "@ant-design/icons";
import { Card, Empty, Space, Tag, Typography } from "antd";
import { AuthLoadingState } from "@/components/auth-loading-state";
import { PersonalShell } from "@/components/personal-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { notificationsApi } from "@/lib/api/notifications";
import type { InboxNotificationItem } from "@/lib/api/types";
import { Button, List } from "antd";

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<InboxNotificationItem[] | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await notificationsApi.list();
      setNotifications(res.items || []);
    } catch (e) {
      console.error("fetch notifications failed", e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => (prev ? prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)) : prev));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      fetchList();
    } catch (e) {
      console.error(e);
    }
  }, [fetchList]);

  useEffect(() => {
    if (user) {
      fetchList();
    }
  }, [user, fetchList]);

  if (loading || !user) {
    return <AuthLoadingState />;
  }

  return (
    <PersonalShell title="消息" subtitle="系统通知、课程提醒与作业动态将汇总在这里。">
      <Card>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Space>
            <BellOutlined />
            <Typography.Text strong>消息中心</Typography.Text>
            <Tag color="blue">预览版</Tag>
            <Button type="link" onClick={handleMarkAllRead} disabled={loadingList || !notifications || notifications.length === 0}>
              全部标为已读
            </Button>
          </Space>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            系统通知与作业提醒将在此处展示，可以标记为已读或点击跳转。
          </Typography.Paragraph>

          {loadingList ? (
            <Typography.Text>正在加载…</Typography.Text>
          ) : notifications && notifications.length > 0 ? (
            <List<InboxNotificationItem>
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button key="read" type="link" onClick={() => handleMarkRead(item.id)} disabled={!!item.readAt}>
                      标为已读
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={<span style={{ fontWeight: item.readAt ? "normal" : "600" }}>{item.title}</span>}
                    description={item.content}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂时没有新消息" />
          )}
        </Space>
      </Card>
    </PersonalShell>
  );
}

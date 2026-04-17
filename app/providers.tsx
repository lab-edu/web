"use client";

import zhCN from "antd/locale/zh_CN";
import { App as AntdApp, ConfigProvider } from "antd";
import { AuthProvider } from "@/lib/auth/auth-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#1967d2",
          borderRadius: 10,
          fontFamily: 'var(--font-noto-sans-sc), "PingFang SC", "Microsoft YaHei", sans-serif',
        },
      }}
    >
      <AntdApp>
        <AuthProvider>{children}</AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

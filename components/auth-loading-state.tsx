"use client";

import { Spin } from "antd";

export function AuthLoadingState() {
  return (
    <main className="auth-page">
      <Spin size="large" tip="正在同步登录状态..." />
    </main>
  );
}
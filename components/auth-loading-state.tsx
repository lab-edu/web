"use client";

import { Spin } from "antd";

interface AuthLoadingStateProps {
  message?: string;
}

export function AuthLoadingState({ message = "正在同步登录状态..." }: AuthLoadingStateProps) {
  return (
    <main className="auth-page">
      <Spin size="large" tip={message} />
    </main>
  );
}
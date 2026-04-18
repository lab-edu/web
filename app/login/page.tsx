"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BookOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Form, Input, Row, Space, Typography } from "antd";
import { ApiError, resolveCoreBaseUrl } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

const coreDocsUrl = `${resolveCoreBaseUrl()}/swagger-ui.html`;

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/courses");
    }
  }, [loading, user, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ identifier, password });
      router.replace("/courses");
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
      } else {
        setError("登录失败，请稍后重试");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Card className="auth-card" bordered={false} bodyStyle={{ padding: 0 }}>
        <Row>
          <Col xs={24} lg={10}>
            <div className="auth-hero">
              <Space direction="vertical" size={18}>
                <Typography.Text style={{ color: "rgba(255,255,255,0.8)" }} className="mono">
                  LAB EDU PLATFORM
                </Typography.Text>
                <Typography.Title level={2} style={{ color: "#fff", margin: 0 }}>
                  实践教学工作台
                </Typography.Title>
                <Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", margin: 0 }}>
                  统一管理课程、实验、公告与提交记录，支持教师与学生全流程协作。
                </Typography.Paragraph>
                <Space direction="vertical" size={10}>
                  <Typography.Text style={{ color: "#fff" }}>
                    <BookOutlined /> 课程空间
                  </Typography.Text>
                  <Typography.Text style={{ color: "#fff" }}>
                    <SafetyCertificateOutlined /> Cookie 会话鉴权
                  </Typography.Text>
                </Space>
              </Space>
            </div>
          </Col>

          <Col xs={24} lg={14}>
            <div style={{ padding: 32 }}>
              <Typography.Title level={3}>登录教学平台</Typography.Title>
              <Typography.Paragraph type="secondary">请输入账号信息以进入课程控制台。</Typography.Paragraph>

              <Form layout="vertical" onSubmitCapture={onSubmit}>
                <Form.Item label="用户名或邮箱" required>
                  <Input value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required />
                </Form.Item>

                <Form.Item label="密码" required>
                  <Input.Password
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </Form.Item>

                {error ? <Alert style={{ marginBottom: 16 }} type="error" message={error} showIcon /> : null}

                <Button block type="primary" htmlType="submit" loading={submitting}>
                  登录
                </Button>
              </Form>

              <Space style={{ marginTop: 16 }} split={<span>|</span>}>
                <Typography.Text type="secondary">
                  还没有账号？
                  <Link href="/register"> 立即注册</Link>
                </Typography.Text>
                <Typography.Text type="secondary">
                  <Link href={coreDocsUrl} target="_blank">查看 API 文档</Link>
                </Typography.Text>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>
    </main>
  );
}

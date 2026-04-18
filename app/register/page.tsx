"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { TeamOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Form, Input, Row, Select, Space, Typography } from "antd";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/lib/api/types";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/courses");
    }
  }, [loading, user, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
        role,
      });

      setSuccess("注册成功，请使用新账号登录。");
      router.push("/login");
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
      } else {
        setError("注册失败，请稍后重试");
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
                  CREATE ACCOUNT
                </Typography.Text>
                <Typography.Title level={2} style={{ color: "#fff", margin: 0 }}>
                  加入课堂空间
                </Typography.Title>
                <Typography.Paragraph style={{ color: "rgba(255,255,255,0.86)", margin: 0 }}>
                  选择教师或学生角色，完成账号创建后即可参与课程、实验与公告协作。
                </Typography.Paragraph>
                <Typography.Text style={{ color: "#fff" }}>
                  <TeamOutlined /> 双角色支持：教师 / 学生
                </Typography.Text>
              </Space>
            </div>
          </Col>

          <Col xs={24} lg={14}>
            <div style={{ padding: 32 }}>
              <Typography.Title level={3}>注册账号</Typography.Title>
              <Typography.Paragraph type="secondary">填写基础资料后即可开始使用平台。</Typography.Paragraph>

              <Form layout="vertical" onSubmitCapture={onSubmit}>
                <Form.Item label="用户名" required>
                  <Input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} required />
                </Form.Item>
                <Form.Item label="显示名">
                  <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </Form.Item>
                <Form.Item label="邮箱" required>
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </Form.Item>
                <Form.Item label="密码" required>
                  <Input.Password value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
                </Form.Item>
                <Form.Item label="身份" required>
                  <Select
                    value={role}
                    onChange={(value) => setRole(value as UserRole)}
                    options={[
                      { value: "STUDENT", label: "学生" },
                      { value: "TEACHER", label: "教师" },
                    ]}
                  />
                </Form.Item>

                {error ? <Alert style={{ marginBottom: 16 }} type="error" message={error} showIcon /> : null}
                {success ? <Alert style={{ marginBottom: 16 }} type="success" message={success} showIcon /> : null}

                <Button block type="primary" htmlType="submit" loading={submitting}>
                  注册
                </Button>
              </Form>

              <Typography.Text type="secondary" style={{ display: "block", marginTop: 16 }}>
                已有账号？<Link href="/login">返回登录</Link>
              </Typography.Text>
            </div>
          </Col>
        </Row>
      </Card>
    </main>
  );
}

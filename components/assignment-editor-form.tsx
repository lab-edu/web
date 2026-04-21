"use client";

import dayjs from "dayjs";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { RichTextEditor } from "@/components/rich-text-editor";
import type {
  AssignmentCreateRequest,
  AssignmentResponse,
  AssignmentTaskItemRequest,
  LearningQuestionType,
} from "@/lib/api/types";

const { TextArea } = Input;

const QUESTION_TYPES: { value: LearningQuestionType; label: string }[] = [
  { value: "SINGLE_CHOICE", label: "单选题" },
  { value: "MULTIPLE_CHOICE", label: "多选题" },
  { value: "SHORT_ANSWER", label: "简答题" },
];

type AssignmentFormValues = {
  title: string;
  description?: string;
  totalScore?: number;
  startAt?: dayjs.Dayjs | null;
  dueAt?: dayjs.Dayjs | null;
  required?: boolean;
  sortOrder?: number;
  published?: boolean;
  notifyOnStart?: boolean;
  notifyBeforeDue24h?: boolean;
  notifyOnDue?: boolean;
  autoCalculateTotal?: boolean;
  taskItems: Array<{
    question: string;
    questionType: LearningQuestionType;
    options?: string;
    referenceAnswer?: string;
    maxScore: number;
    sortOrder?: number;
  }>;
};

function toTaskItems(items: AssignmentFormValues["taskItems"]): AssignmentTaskItemRequest[] {
  return items.map((item, index) => ({
    question: item.question.trim(),
    questionType: item.questionType,
    options: (item.options ?? "")
      .split("\n")
      .map((opt) => opt.trim())
      .filter(Boolean),
    referenceAnswer: item.referenceAnswer?.trim() ?? "",
    maxScore: Number(item.maxScore) || 0,
    sortOrder: item.sortOrder ?? index,
  }));
}

function toPayload(values: AssignmentFormValues): AssignmentCreateRequest {
  const autoCalculateTotal = values.autoCalculateTotal ?? true;
  const taskItems = toTaskItems(values.taskItems);
  const computedTotal = taskItems.reduce((sum, item) => sum + item.maxScore, 0);

  return {
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    totalScore: autoCalculateTotal ? computedTotal : values.totalScore,
    startAt: values.startAt ? values.startAt.toISOString() : null,
    dueAt: values.dueAt ? values.dueAt.toISOString() : null,
    required: values.required ?? false,
    sortOrder: values.sortOrder ?? 0,
    published: values.published ?? false,
    notifyOnStart: values.notifyOnStart ?? false,
    notifyBeforeDue24h: values.notifyBeforeDue24h ?? false,
    notifyOnDue: values.notifyOnDue ?? false,
    autoCalculateTotal,
    taskItems,
  };
}

function getInitialValues(initial?: AssignmentResponse): AssignmentFormValues {
  if (!initial) {
    return {
      title: "",
      description: "",
      totalScore: undefined,
      startAt: null,
      dueAt: null,
      required: true,
      sortOrder: 0,
      published: false,
      notifyOnStart: false,
      notifyBeforeDue24h: true,
      notifyOnDue: false,
      autoCalculateTotal: true,
      taskItems: [
        {
          question: "",
          questionType: "SINGLE_CHOICE",
          options: "",
          referenceAnswer: "",
          maxScore: 0,
          sortOrder: 0,
        },
      ],
    };
  }

  return {
    title: initial.title,
    description: initial.description ?? "",
    totalScore: initial.totalScore,
    startAt: initial.startAt ? dayjs(initial.startAt) : null,
    dueAt: initial.dueAt ? dayjs(initial.dueAt) : null,
    required: initial.required,
    sortOrder: initial.sortOrder,
    published: initial.published,
    notifyOnStart: initial.notifyOnStart,
    notifyBeforeDue24h: initial.notifyBeforeDue24h,
    notifyOnDue: initial.notifyOnDue,
    autoCalculateTotal: initial.autoCalculateTotal,
    taskItems: initial.taskItems.map((item, index) => ({
      question: item.question,
      questionType: item.questionType,
      options: item.options.join("\n"),
      referenceAnswer: item.referenceAnswer ?? "",
      maxScore: item.maxScore,
      sortOrder: item.sortOrder ?? index,
    })),
  };
}

type Props = {
  initial?: AssignmentResponse;
  submitting: boolean;
  submitText: string;
  onSubmit: (payload: AssignmentCreateRequest) => Promise<void>;
  onCancel: () => void;
};

export function AssignmentEditorForm({
  initial,
  submitting,
  submitText,
  onSubmit,
  onCancel,
}: Props) {
  const [form] = Form.useForm<AssignmentFormValues>();

  return (
    <Form<AssignmentFormValues>
      form={form}
      layout="vertical"
      initialValues={getInitialValues(initial)}
      onFinish={async (values) => {
        const payload = toPayload(values);
        await onSubmit(payload);
      }}
    >
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="作业标题"
              name="title"
              rules={[{ required: true, message: "请输入作业标题" }]}
            >
              <Input placeholder="例如：第一次随堂测试" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="排序序号" name="sortOrder">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="数字越小越靠前" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="作业描述" name="description">
          <RichTextEditor placeholder="请输入作业描述（可选）" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="开始时间" name="startAt">
              <DatePicker showTime style={{ width: "100%" }} placeholder="选择开始时间（可选）" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="截止时间" name="dueAt">
              <DatePicker showTime style={{ width: "100%" }} placeholder="选择截止时间（可选）" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="总分" name="totalScore">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="自动计算或手动设置" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="自动计算总分" name="autoCalculateTotal" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Form.Item label="是否必做" name="required" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="立即发布" name="published" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="开始提醒" name="notifyOnStart" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="截止前24h提醒" name="notifyBeforeDue24h" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Form.List name="taskItems">
        {(fields, { add, remove, move }) => (
          <Card
            title={
              <Space>
                <Typography.Text strong>题目列表</Typography.Text>
                <Typography.Text type="secondary">（共 {fields.length} 题）</Typography.Text>
              </Space>
            }
            extra={
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ questionType: "SINGLE_CHOICE", maxScore: 0 })}
              >
                添加题目
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            {fields.map((field, index) => (
              <Card
                key={field.key}
                type="inner"
                title={`题目 ${index + 1}`}
                extra={
                  <Space>
                    <Button
                      size="small"
                      icon={<ArrowUpOutlined />}
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    />
                    <Button
                      size="small"
                      icon={<ArrowDownOutlined />}
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    />
                    <Button
                      size="small"
                      danger
                      icon={<MinusCircleOutlined />}
                      disabled={fields.length === 1}
                      onClick={() => remove(field.name)}
                    />
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <Form.Item
                  label="题目内容"
                  name={[field.name, "question"]}
                  rules={[{ required: true, message: "请输入题目内容" }]}
                >
                  <TextArea rows={2} placeholder="请输入题目内容" />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="题型"
                      name={[field.name, "questionType"]}
                      initialValue="SINGLE_CHOICE"
                    >
                      <Select>
                        {QUESTION_TYPES.map((type) => (
                          <Select.Option key={type.value} value={type.value}>
                            {type.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="分值"
                      name={[field.name, "maxScore"]}
                      rules={[{ required: true, message: "请输入分值" }]}
                      initialValue={0}
                    >
                      <InputNumber min={0} style={{ width: "100%" }} placeholder="请输入分值" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="选项（每行一个，仅选择题需要）"
                  name={[field.name, "options"]}
                >
                  <TextArea rows={3} placeholder={"每行输入一个选项，例如：\n选项A\n选项B\n选项C"} />
                </Form.Item>

                <Form.Item label="参考答案" name={[field.name, "referenceAnswer"]}>
                  <TextArea rows={2} placeholder="请输入参考答案（教师可见）" />
                </Form.Item>
              </Card>
            ))}
          </Card>
        )}
      </Form.List>

      <Card>
        <Space>
          <Button type="primary" htmlType="submit" loading={submitting} size="large">
            {submitText}
          </Button>
          <Button onClick={onCancel} size="large">
            取消
          </Button>
        </Space>
      </Card>
    </Form>
  );
}

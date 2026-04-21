"use client";

import Image from "next/image";
import DocViewer from "react-doc-viewer";
import { CourseResource } from "@/lib/api/types";
import { resourcesApi } from "@/lib/api/resources";
import { Card, Alert, Typography } from "antd";
import { FileImageOutlined, VideoCameraOutlined, FileOutlined } from "@ant-design/icons";

interface PreviewRendererProps {
  resource: CourseResource;
}

export function PreviewRenderer({ resource }: PreviewRendererProps) {
  // 仅处理 FILE 类型资源
  if (resource.type !== "FILE") {
    return (
      <Card title="外部资源" size="small">
        <Typography.Paragraph>
          此资源为外部链接，请点击以下链接访问：
        </Typography.Paragraph>
        <a href={resource.externalUrl ?? "#"} target="_blank" rel="noreferrer">
          {resource.externalUrl}
        </a>
      </Card>
    );
  }

  const fileName = resource.fileName?.toLowerCase() || "";
  const fileUrl = resourcesApi.buildFileUrl(resource.id);
  const publicFileUrl = resourcesApi.buildPublicFileUrl(resource.id);

  // 检测是否为 Office 文档
  const isOfficeDocument = /\.(ppt|pptx|doc|docx|xls|xlsx)$/i.test(fileName);
  // 检测是否为视频文件
  const isVideo = /\.(mp4|webm|ogg|mov|avi|wmv)$/i.test(fileName);
  // 检测是否为图片文件
  const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
  // 检测是否为文本文件
  const isText = /\.(txt|md|json|js|ts|html|css|xml)$/i.test(fileName);

  // 对于 Office 文档，使用 Microsoft Office Online 嵌入预览
  if (isOfficeDocument) {
    // Microsoft Office Online 预览 URL
    const officeOnlineUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicFileUrl)}`;

    return (
      <Card title="文件预览" size="small">
        <Typography.Paragraph>
          <FileOutlined /> Office 文档预览 (通过 Microsoft Office Online)
        </Typography.Paragraph>
        <iframe
          src={officeOnlineUrl}
          width="100%"
          height="600px"
          style={{ border: "1px solid #d9d9d9", borderRadius: 4 }}
          title="Office 文档预览"
          sandbox="allow-scripts allow-same-origin"
        />
        <Alert
          style={{ marginTop: 12 }}
          message={
            <span>
              此预览使用 Microsoft Office Online 服务。如果无法加载，请尝试{' '}
              <a href={fileUrl} target="_blank" rel="noreferrer">直接下载文件</a>后查看。
            </span>
          }
          type="info"
          showIcon
        />
      </Card>
    );
  }

  // 对于视频文件，使用自定义预览器
  if (isVideo) {
    return (
      <Card title="文件预览" size="small">
        <Typography.Paragraph>
          <VideoCameraOutlined /> 视频预览
        </Typography.Paragraph>
        <video
          controls
          src={publicFileUrl}
          style={{ width: "100%", maxHeight: "500px", border: "1px solid #d9d9d9", borderRadius: 4 }}
        >
          您的浏览器不支持视频播放。
        </video>
      </Card>
    );
  }

  // 对于 PDF、图片、文本等文件，使用 react-doc-viewer
  // 扩展名到 react-doc-viewer 文件类型的映射
  const getFileType = (filename: string): string | null => {
    const ext = filename.split('.').pop() || '';
    const typeMap: Record<string, string> = {
      // PDF
      pdf: 'pdf',
      // Images
      jpg: 'jpg', jpeg: 'jpeg', png: 'png', gif: 'gif', bmp: 'bmp', webp: 'webp', svg: 'svg',
      // Text files
      txt: 'txt', md: 'txt', json: 'txt', js: 'txt', ts: 'txt', html: 'txt', css: 'txt', xml: 'txt', csv: 'txt',
      // Office documents
      ppt: 'ppt', pptx: 'pptx', doc: 'doc', docx: 'docx', xls: 'xls', xlsx: 'xlsx',
    };
    return typeMap[ext] || null;
  };

  const fileType = getFileType(fileName);

  // 如果文件类型受支持，使用 react-doc-viewer
  if (fileType) {
    return (
      <Card title="文件预览" size="small">
        <DocViewer
          documents={[
            {
              uri: publicFileUrl,
              fileType: fileType,
            },
          ]}
          config={{
            header: {
              disableHeader: false,
              disableFileName: false,
              retainURLParams: false,
            },
          }}
          theme={{
            primary: "#1890ff",
            secondary: "#f0f0f0",
            tertiary: "#ffffff",
          }}
          style={{ height: "600px", minHeight: "400px" }}
        />
        <Alert
          style={{ marginTop: 12 }}
          message="如果预览显示异常，请尝试下载后查看。"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  // 回退到自定义预览（对于不支持的类型或 DocViewer 出错时）
  // 使用之前定义的 isImage 和 isText 变量

  if (isImage) {
    return (
      <Card title="文件预览" size="small">
        <Typography.Paragraph>
          <FileImageOutlined /> 图片预览
        </Typography.Paragraph>
        <div style={{ textAlign: "center" }}>
          <div style={{ position: "relative", width: "100%", height: "500px", border: "1px solid #d9d9d9", borderRadius: 4 }}>
            <Image
              src={publicFileUrl}
              alt={resource.name}
              fill
              style={{ objectFit: "contain" }}
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        </div>
      </Card>
    );
  }

  if (isText) {
    return (
      <Card title="文件预览" size="small">
        <Typography.Paragraph>
          <FileOutlined /> 文本预览
        </Typography.Paragraph>
        <iframe
          src={publicFileUrl}
          style={{ width: "100%", height: "400px", border: "1px solid #d9d9d9", borderRadius: 4 }}
          title="文本预览"
          sandbox="allow-same-origin"
        />
        <Alert
          style={{ marginTop: 12 }}
          message="文本预览可能受编码影响，若显示异常请下载后查看。"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  // 不支持预览的文件类型
  return (
    <Card title="文件预览" size="small">
      <Typography.Paragraph>
        <FileOutlined /> 该文件格式不支持在线预览，请下载后查看。
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary">
        支持预览的格式：PDF、Office 文档 (Word/Excel/PowerPoint)、图片、视频、文本文件。
      </Typography.Paragraph>
    </Card>
  );
}
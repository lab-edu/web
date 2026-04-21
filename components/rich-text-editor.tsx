"use client";

import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { Button, Space } from "antd";
import {
  BoldOutlined,
  CodeOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  UndoOutlined,
  UnorderedListOutlined,
  UnderlineOutlined,
} from "@ant-design/icons";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function normalizeHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "<p></p>";
  }

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "请输入内容",
  disabled = false,
  className,
}: RichTextEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    [placeholder],
  );

  const editor = useEditor({
    extensions,
    content: normalizeHtml(value),
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.isEmpty ? "" : currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-text-editor__content",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextValue = normalizeHtml(value);
    if (editor.getHTML() !== nextValue) {
      editor.commands.setContent(nextValue, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return <div className={`rich-text-editor ${className ?? ""}`.trim()} />;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const nextUrl = window.prompt("请输入链接地址", previousUrl ?? "");

    if (nextUrl === null) {
      return;
    }

    const url = nextUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const toolbarButton = (active: boolean, label: string, icon: ReactNode, onClick: () => void) => (
    <Button
      type={active ? "primary" : "text"}
      size="small"
      icon={icon}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    />
  );

  return (
    <div className={`rich-text-editor ${className ?? ""}`.trim()}>
      <Space wrap size={4} className="rich-text-editor__toolbar">
        {toolbarButton(editor.isActive("heading", { level: 1 }), "一级标题", <span className="rich-text-editor__toolbar-text">H1</span>, () => editor.chain().focus().toggleHeading({ level: 1 }).run())}
        {toolbarButton(editor.isActive("heading", { level: 2 }), "二级标题", <span className="rich-text-editor__toolbar-text">H2</span>, () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        {toolbarButton(editor.isActive("heading", { level: 3 }), "三级标题", <span className="rich-text-editor__toolbar-text">H3</span>, () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
        {toolbarButton(editor.isActive("bold"), "加粗", <BoldOutlined />, () => editor.chain().focus().toggleBold().run())}
        {toolbarButton(editor.isActive("italic"), "斜体", <ItalicOutlined />, () => editor.chain().focus().toggleItalic().run())}
        {toolbarButton(editor.isActive("underline"), "下划线", <UnderlineOutlined />, () => editor.chain().focus().toggleUnderline().run())}
        {toolbarButton(editor.isActive("strike"), "删除线", <StrikethroughOutlined />, () => editor.chain().focus().toggleStrike().run())}
        {toolbarButton(editor.isActive("bulletList"), "无序列表", <UnorderedListOutlined />, () => editor.chain().focus().toggleBulletList().run())}
        {toolbarButton(editor.isActive("orderedList"), "有序列表", <OrderedListOutlined />, () => editor.chain().focus().toggleOrderedList().run())}
        {toolbarButton(editor.isActive("codeBlock"), "代码块", <CodeOutlined />, () => editor.chain().focus().toggleCodeBlock().run())}
        {toolbarButton(editor.isActive("link"), "链接", <LinkOutlined />, setLink)}
        {toolbarButton(false, "撤销", <UndoOutlined />, () => editor.chain().focus().undo().run())}
        {toolbarButton(false, "重做", <RedoOutlined />, () => editor.chain().focus().redo().run())}
      </Space>

      <EditorContent editor={editor} />
    </div>
  );
}
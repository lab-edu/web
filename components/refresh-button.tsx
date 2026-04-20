"use client";

import { ReloadOutlined } from "@ant-design/icons";
import { Button, type ButtonProps } from "antd";

type RefreshButtonProps = Omit<ButtonProps, "icon" | "children"> & {
  label?: string;
};

export function RefreshButton({ label = "刷新", ...props }: RefreshButtonProps) {
  return (
    <Button icon={<ReloadOutlined />} {...props}>
      {label}
    </Button>
  );
}
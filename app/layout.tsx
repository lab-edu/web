import type { Metadata } from "next";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import { AppProviders } from "./providers";
import "antd/dist/reset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "lab-edu | 教学实验平台",
  description: "课程、实验与提交的一体化教学平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

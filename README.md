# lab-edu web

lab-edu 的前端应用，基于 Next.js（App Router）。

## 仓库用途

- 提供统一前端页面入口
- 通过同源路径访问后端能力（当前约定前缀为 `/core/`）
- 作为容器化部署与 GHCR 镜像发布的前端交付单元

## 目录结构

```text
web/
├── app/                              # App Router 页面与全局样式
├── public/                           # 静态资源
├── Dockerfile                        # 生产镜像构建文件
├── .dockerignore                     # Docker 构建上下文过滤
├── .github/workflows/
│   └── web-image-ghcr.yml            # 构建并推送 GHCR 镜像
├── package.json                      # 依赖与脚本
└── tsconfig.json                     # TypeScript 配置
```

## 本地运行

### 1) 安装依赖

```bash
npm ci
```

### 2) 启动开发服务

```bash
npm run dev
```

默认访问地址：`http://localhost:3000`

## 构建与启动

### 1) 本地生产构建

```bash
npm run build
npm run start
```

### 2) Docker 构建

```bash
docker build -t lab-edu-web-test .
```

## 联调约定

- 页面访问后端健康检查使用：`/core/actuator/health`
- 该路径由 `infra/nginx.conf` 转发到 core 服务的 `/actuator/health`
- 不建议在前端直接拼接 core 容器地址或端口

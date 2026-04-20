# lab-edu web

lab-edu 的前端应用，基于 Next.js（App Router）。

## 仓库用途

- 提供统一前端页面入口
- 通过可配置的 API 基地址访问后端能力（环境变量驱动）
- 作为容器化部署与 GHCR 镜像发布的前端交付单元

## 目录结构

```text
web/
├── app/                              # App Router 页面与全局样式
│   ├── login/                        # 登录页
│   ├── register/                     # 注册页
│   ├── courses/                      # 课程列表/详情页
│   └── experiments/                  # 实验详情与提交页
├── lib/api/                          # 统一 API 调用封装
├── lib/auth/                         # 统一登录状态管理
├── middleware.ts                     # 未登录访问拦截
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

## 环境变量

- `NEXT_PUBLIC_CORE_BASE_URL`：core 服务的基地址（例如 `http://localhost:8080`）
- 前端会自动拼接 `.../api/v1` 与 `.../swagger-ui.html`

## 联调约定

- 前端业务请求统一通过 `lib/api/client.ts` 发送，默认使用：`NEXT_PUBLIC_CORE_BASE_URL`
- 本地直连 core 可设置：`NEXT_PUBLIC_CORE_BASE_URL=http://localhost:8080`
- 请求会自动携带登录状态，用户刷新页面后仍可继续访问已登录内容
- 登录状态失效后，访问课程与实验页面会自动回到登录页
- `/register` 为公开页面，支持学生/教师账号创建
- 不建议在页面组件里直接写 `fetch` 到后端地址，统一通过 `lib/api` 封装

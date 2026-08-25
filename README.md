# Terminal Blog

一个使用 Nuxt 4、Nuxt Content 和纯静态生成构建的命令行风格个人博客。每篇 Markdown 文章都会生成独立 HTML，部署后不需要 Node 服务。

## 本地开发

项目使用 pnpm：

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:3000`。开发环境会自动使用这个地址生成临时 SEO 链接。

## 新增文章

在 `content/posts` 文件夹中新建 Markdown 文件。文件名必须是小写 kebab-case：

```text
content/posts/my-first-post.md → /posts/my-first-post
```

`content` 下的 Markdown 会按文件系统自动生成页面：

```text
content/posts/my-first-post.md → /posts/my-first-post
content/about/index.md         → /about
content/contact/index.md       → /contact
content/guides/setup.md        → /guides/setup
```

新增内容页不需要再创建对应的 Vue 页面。每个页面必须包含 `title` 和 `description`；`posts` 下的文章还必须包含 `date`。文章 Frontmatter 示例：

```md
---
title: 我的第一篇文章
date: '2026-08-24'
description: 一句适合搜索结果展示的文章摘要。
tags:
  - Nuxt
  - SSG
image: /images/my-first-post.png # 可选
---

正文从这里开始。页面会自动使用 `title` 渲染唯一的一级标题，正文请从二级标题开始。

## 第一个小节
```

`title`、`description` 缺失或格式错误时，静态构建会失败；`posts` 下缺少 `date` 或 `date` 不是有效的 `YYYY-MM-DD` 时也会失败。`tags`、`image` 和非文章页面的 `date` 可省略。

About 页面由 `content/about/index.md` 生成，可直接编辑该文件。

## 检查与静态生成

正式生成前必须提供完整站点地址，以确保 canonical、分享链接、robots 和 sitemap 正确：

```bash
# PowerShell
$env:NUXT_PUBLIC_SITE_URL='https://blog.example.com'
pnpm typecheck
pnpm test
pnpm generate
```

生成结果位于 `.output/public`，其中只有静态文件，不包含 Pages Functions 或运行时服务。

Cloudflare Pages 配置：

```text
Build command: pnpm generate
Build output directory: .output/public
Environment variable: NUXT_PUBLIC_SITE_URL=https://你的域名
```

## 个性化

站点名、作者、简介和终端提示符集中在 `app/app.config.ts`。终端样式位于 `app/assets/css/main.css`。

终端支持：

```text
help
pwd
ls
cd posts
cat hello-terminal.md
open hello-terminal.md
cd ../
cd about
cat index.md
clear
```

文章文件名可以直接点击进入独立页面；文章页顶部和底部统一提供“返回首页”。终端同时支持基于当前目录的 Tab 补全和上下键历史。清屏只使用 `clear` 命令。首页欢迎语、站点名、作者、简介和终端提示符集中在 `app/app.config.ts`。

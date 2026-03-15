# shadcn/ui 组件库扩充 — 资料清单

> 检索思路：以项目知识库中两份文档（像素风 UI 资源手册 + 前端设计借鉴分析）为锚点，围绕以下维度展开检索：
> 1. **Registry 机制**：官方文档 + 自建教程 + Schema 规范（CLI 3.0 已发布 namespaced registry）
> 2. **动效生态**：lucide-animated / Motion Primitives / Animate UI / Magic UI — 对应「前端设计借鉴分析」中动态图标 + 微交互章节
> 3. **像素风/复古组件**：8bitcn / pixelact-ui / Retro UI — 对应「像素风 UI 资源手册」中的设计系统需求
> 4. **通用扩展库**：覆盖 AI 聊天、表单、数据可视化等高频场景
> 5. **构建依赖 & 工具链**：CVA / Radix / tw-animate-css 等核心包
> 6. **聚合索引**：awesome 列表 + Registry Directory 浏览器

---

## 一、官方文档

| 资源 | URL | 备注 |
|------|-----|------|
| Registry 概念介绍 | https://ui.shadcn.com/docs/registry | CLI 3.0 支持 namespaced registry `@registry/name` |
| 自建 Registry 教程 | https://ui.shadcn.com/docs/registry/getting-started | 含 `registry:build` 脚本配置 |
| Registry Item Schema 规范 | https://ui.shadcn.com/schema/registry-item.json | JSON Schema |
| Registry JSON Schema | https://ui.shadcn.com/schema/registry.json | 入口文件规范 |
| Registry Examples | https://ui.shadcn.com/docs/registry/examples | style / block / component 示例 |
| 官方 Registry 目录（已收录第三方库列表） | https://ui.shadcn.com/docs/directory | 所有已审核的社区 registry |
| 添加 Registry 到官方目录 | https://ui.shadcn.com/docs/registry/registry-index | PR 流程 & 校验规则 |
| 官方 Registry 模板仓库（Tailwind v4） | https://github.com/shadcn-ui/registry-template | — |
| Tailwind v3 版模板 | 同 org 下 `registry-template-v3` | — |
| CLI 3.0 + MCP Server Changelog | https://ui.shadcn.com/docs/changelog/2025-08-cli-3-mcp | namespaced registry / 私有认证 / search & view 命令 |
| 完整 Changelog | https://ui.shadcn.com/docs/changelog | 按月追踪新特性 |

---

## 二、教程 & 深度文章

| 资源 | URL | 备注 |
|------|-----|------|
| Vercel Academy — Creating a Registry File | https://vercel.com/academy/shadcn-ui/creating-a-shadcn-registry-file | — |
| Vercel Academy — shadcn/ui 完整课程 | https://vercel.com/academy/shadcn-ui | 含自定义组件 / 发布 |
| Publishing custom shadcn/ui components | https://www.niels.foo/post/publishing-custom-shadcn-ui-components | 社区教程 |
| Shadcn Registry 补充指南 | https://ouassim.tech/notes/shadcn-registry-a-better-way-to-manage-your-ui-components/ | CLI 选项 / redirect 技巧 |
| 社区 Registry 模板（vantezzen） | https://github.com/vantezzen/shadcn-registry-template | — |
| freeCodeCamp — How to Set Up a Registry | https://www.freecodecamp.org/news/how-to-set-up-a-registry-in-shadcn/ | 2025-10，含 namespace / 认证 / 依赖解析 |
| Tailkits — Shadcn Registry Guide | https://tailkits.com/blog/shadcn-registry/ | Schema / CLI / 实操 |

---

## 三、动效 & 图标生态库

> 对应知识库文档：「前端设计借鉴分析.md」中 lucide-animated 章节 + 动画类型设计模式

| 库名 | 定位 | URL | Registry 安装示例 |
|------|------|-----|-------------------|
| **lucide-animated** | 350+ 动态 Lucide 图标，Motion 驱动 | https://lucide-animated.com | `npx shadcn add @lucide-animated/heart` |
| **Animate UI** | shadcn 组件的 Motion 动画层，Radix 原语兼容 | https://animate-ui.com | `npx shadcn add @animate-ui/radix-accordion` |
| **Motion Primitives** | 专为 shadcn 设计的动画原语（text effect / spotlight / dock） | https://motion-primitives.com | CLI 或 shadcn registry 安装 |
| **Magic UI** | 150+ 动效组件，Motion 驱动 | https://magicui.design | — |
| **Aceternity UI** | 高级动画组件，Landing Page 向 | https://ui.aceternity.com | — |
| **Eldora UI** | TypeScript + Motion 组件库 | https://eldoraui.site | — |
| **Moving Icons (Svelte)** | lucide-animated 的 Svelte 版 | https://www.movingicons.dev | `npx shadcn-svelte add https://movingicons.dev/r/[name]` |
| **Vue 动态图标** | lucide-animated 的 Vue 版 (motion-v) | https://imfenghuang.github.io/icons/ | — |

---

## 四、像素风 / 复古组件库

> 对应知识库文档：「像素风UI与状态可视化前端资源手册.md」中 1.5 设计系统构建建议

| 库名 | 定位 | URL | Registry 安装示例 |
|------|------|-----|-------------------|
| **8bitcn/ui** | 复古 8-bit 风格 shadcn 组件，框架无关 | https://www.8bitcn.com | `pnpm dlx shadcn@latest add @8bitcn/button` |
| **pixelact-ui** | 像素艺术风格 shadcn registry 组件 | https://github.com/pixelact-ui/pixelact-ui | registry-based 安装 |
| **Retro UI** | 80s/90s 复古风格组件 | https://retroui.dev | — |
| **warcraftcn/ui** | 魔兽争霸主题 shadcn 组件（类似思路参考） | awesome-shadcn-ui 收录 | — |

**与像素风资源手册的衔接点**：
- 8bitcn 的按钮/卡片/标签组件可直接用于「状态可视化看板」的 UI 层
- pixelact-ui 的 Dialog / Input 组件适合像素办公室场景的交互面板
- 结合手册中的 CSS `image-rendering: pixelated` + `Press Start 2P` 字体方案

---

## 五、通用扩展库

| 库名 | 定位 | URL |
|------|------|-----|
| **Origin UI** | 400+ 免费组件，25+ 分类 | https://originui.com |
| **Cult UI** | AI 代码生成 + 全栈模板 | https://cult-ui.com |
| **Kibo UI** | 可组合无障碍组件 | https://kiboui.com |
| **assistant-ui** | AI 聊天界面组件（Radix 原语） | https://assistant-ui.com |
| **Tailark** | Dark-mode-first 组件 | https://tailark.com |
| **FormCN** | 表单专用组件 | https://formcn.dev |
| **Shadcn Studio** | 1000+ 组件/Block/模板（付费） | https://shadcnstudio.com |
| **Kokonut UI** | 动画 + 无障碍组件 | allshadcn.com 收录 |
| **Glass UI** | 40+ 毛玻璃风格组件 | shadcn directory 收录 |

---

## 六、awesome 合集 & 聚合索引

| 资源 | URL | 备注 |
|------|-----|------|
| awesome-shadcn-ui（18.9k ⭐，持续更新） | https://github.com/birobirobiro/awesome-shadcn-ui | 组件 / 模板 / SaaS / Portfolio 全覆盖 |
| registry.directory | https://registry.directory | IDE 预览器 + 一键安装命令 |
| shadcnregistry.com | https://shadcnregistry.com | 按 registry 分类浏览 |
| allshadcn.com | https://allshadcn.com | 工具 + 组件详情评测 |
| shadcn.io（社区） | https://www.shadcn.io | AI-native 组件 registry |

---

## 七、关键构建依赖

| 包名 | 用途 | npm |
|------|------|-----|
| `class-variance-authority` (CVA) | 组件变体定义 | `cva` |
| `clsx` + `tailwind-merge` | 类名合并（`cn()` 函数） | — |
| `@radix-ui/*` | 无障碍行为原语 | — |
| `tw-animate-css` | 动画类（替代 tailwindcss-animate，Tailwind v4） | — |
| `lucide-react` | 默认图标库（1600+ SVG） | — |
| `motion`（原 framer-motion） | 动效引擎（扩展库常用） | — |
| `shadcn` | CLI 本体（3.0+） | `npx shadcn@latest` |

---

## 八、与项目知识库的交叉引用

| 知识库文档章节 | 对应资源 | 应用场景 |
|---------------|---------|---------|
| 像素风手册 §1.4 方案三：CSS + React | 8bitcn / pixelact-ui | 像素状态看板的 UI 组件层 |
| 像素风手册 §1.5 设计系统构建 | 8bitcn 的 ThemeProvider + CSS 变量 | 像素风设计 token 标准化 |
| 像素风手册 §2.1 状态映射模型 | assistant-ui 聊天组件 | Agent 状态的对话气泡展示 |
| 前端设计 §六 lucide-animated 技术架构 | lucide-animated registry | `npx shadcn add @lucide-animated/{icon}` |
| 前端设计 §七 图标分类选型 | lucide-animated 350+ 图标 | 按动效等级(🔴🟡🟢)选用 |
| 前端设计 §八 动画设计模式 | Motion Primitives / Animate UI | 描边绘制 / 弹性缩放 / 循环微动 |
| 前端设计 §九 快速集成工作流 | shadcn CLI 3.0 namespaced registry | `@lucide-animated/check` 一行安装 |

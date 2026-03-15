# 像素风 UI 设计资源 —— 分阶段检索清单

> 目标：系统性收集像素风格优先的 UI 设计资源，构建可复用的素材库、组件库与设计模式知识库
> 依赖文档：`像素风UI与状态可视化前端资源手册.md` · `前端设计借鉴分析.md` · `shadcn-ui组件库扩充资料清单.md`

---

## Phase 0：检索基础设施准备

**目标**：确认采集工具链就绪，定义分类体系与存储结构

| # | 任务 | 产出 | 优先级 |
|---|------|------|--------|
| 0.1 | 确认 Playwright + JS 注入环境可访问目标站点（itch.io / Dribbble / Figma Community） | 站点可达性报告 | P0 |
| 0.2 | 定义像素风素材分类 taxonomy | 分类枚举 JSON Schema | P0 |
| 0.3 | 配置 SHA-256 去重管道（截图 + 素材文件） | 去重脚本 | P0 |
| 0.4 | 建立 MongoDB collection `pixel_ui_resources`，字段包含 source_url / category / license / tags / extracted_tokens | Pydantic 模型 | P0 |

**分类体系草案**：

```
pixel_ui_resources/
├── components/          # 按钮、卡片、输入框、对话框、进度条等 UI 组件
├── tilesets/            # 场景地块（办公室、城镇、地牢等）
├── icons/               # 图标集（状态图标、物品图标、操作图标）
├── characters/          # 角色 spritesheet（idle/walk/work/error 等状态）
├── fonts/               # 像素字体
├── color_palettes/      # 调色板（NES/PICO-8/自定义）
├── full_ui_kits/        # 完整 UI Kit（Figma/PNG/Aseprite 源文件）
├── web_components/      # shadcn 生态组件库（8bitcn/pixelact-ui 等）
├── design_patterns/     # 设计模式（状态映射、空间布局、动效方案）
└── websites/            # 像素风网站案例截图与分析
```

---

## Phase 1：组件库与工程化资源

**目标**：收集可直接集成到 React/Tailwind 项目的像素风组件库

### 1.1 shadcn 生态像素组件

| # | 检索目标 | 检索查询 | 目标站点 | 预期产出 |
|---|---------|---------|---------|---------|
| 1.1.1 | 8bitcn 完整组件清单 + 源码结构分析 | `site:github.com 8bitcn` | GitHub | 组件清单 + API 文档提取 |
| 1.1.2 | pixelact-ui registry 组件与安装方式 | `pixelact-ui shadcn registry` | GitHub + npm | 安装指南 + 组件截图 |
| 1.1.3 | Retro UI 组件与 neo-brutalist 设计 token | `retroui.dev components` | retroui.dev | 设计 token 提取 |
| 1.1.4 | warcraftcn/ui 主题化方案参考 | `warcraftcn shadcn theme` | GitHub | 主题 CSS 变量提取 |
| 1.1.5 | shadcn directory 中其他复古/像素风 registry | `pixel retro 8bit` | ui.shadcn.com/docs/directory | 新库发现 |

### 1.2 像素风 CSS 框架与设计系统

| # | 检索查询 | 目标站点 | 说明 |
|---|---------|---------|------|
| 1.2.1 | `pixel art CSS framework 2025 2026` | Google / GitHub | 独立 CSS 像素框架（NES.css 等同类） |
| 1.2.2 | `NES.css alternatives pixel` | GitHub / npm | NES.css 衍生或替代项目 |
| 1.2.3 | `Press Start 2P font alternatives pixel` | Google Fonts / fonts.google.com | 像素字体完整列表 |
| 1.2.4 | `pixel art design system tokens figma` | Figma Community | 带设计 token 的像素 Figma 文件 |
| 1.2.5 | `PICO-8 color palette CSS variables` | GitHub / web | 经典限制调色板的 CSS 变量定义 |

### 1.3 像素风动效资源

| # | 检索查询 | 关联知识库章节 | 说明 |
|---|---------|-------------|------|
| 1.3.1 | `pixel art CSS animation sprite steps()` | 资源手册 §1.4 方案三 | CSS steps() 精灵动画最佳实践 |
| 1.3.2 | `pixel art loading animation codepen` | — | 像素风加载动画 CodePen 合集 |
| 1.3.3 | `8bitcn animation pixel button hover` | 扩充清单 §四 | 8bitcn 组件动效定制 |
| 1.3.4 | `retro pixel transition effect web` | 前端设计 §八 | 像素风页面过渡效果 |

---

## Phase 2：美术素材与 Spritesheet 资源

**目标**：按场景分类采集可用于状态可视化的像素素材

### 2.1 itch.io 系统采集

**采集策略**：itch.io 是像素素材密度最高的平台，需按 tag 组合分批检索

| # | Tag 组合 | 筛选条件 | 重点关注 |
|---|---------|---------|---------|
| 2.1.1 | `pixel-art` + `user-interface` | Free + Top rated | 通用 UI 组件（按钮/面板/血条） |
| 2.1.2 | `pixel-art` + `gui` | Free + Top rated | RPG 风 GUI（背包/商店/对话） |
| 2.1.3 | `pixel-art` + `icons` | Free | 图标集（物品/状态/操作） |
| 2.1.4 | `pixel-art` + `characters` | Free | 角色 spritesheet（多状态动画） |
| 2.1.5 | `pixel-art` + `tileset` + `interior` | 付费 ≤$5 | 室内场景地块（办公室/实验室） |
| 2.1.6 | `pixel-art` + `fonts` | Free | 像素字体 |
| 2.1.7 | `pixel-art` + `effects` + `particles` | Free | 粒子/特效/状态视觉反馈 |

**每个素材包需提取**：
- 许可证类型（CC0 / CC-BY / 仅限非商用）
- 尺寸规格（16×16 / 32×32 / 64×64）
- 帧数与动画状态列表
- 调色板颜色数
- 格式（PNG Spritesheet / Aseprite / JSON 元数据）

### 2.2 OpenGameArt 专项

| # | 检索查询 | 说明 |
|---|---------|------|
| 2.2.1 | `office pixel art tileset` | 办公室场景素材 |
| 2.2.2 | `pixel character animation idle walk` | 多状态角色动画 |
| 2.2.3 | `pixel UI buttons panels frames` | UI 框架素材 |
| 2.2.4 | `pixel icons 16x16 32x32` | 小尺寸图标集 |

### 2.3 CraftPix 与付费素材评估

| # | 检索目标 | 预算上限 | 评估维度 |
|---|---------|---------|---------|
| 2.3.1 | CraftPix Pixel Art Game UI 分类全览 | 浏览 | 质量/风格统一性/可定制程度 |
| 2.3.2 | Unity Asset Store 像素 UI Kit 对比 | ≤$40 | 组件完整度/引擎无关性/修改自由度 |
| 2.3.3 | GraphicRiver pixel art UI templates | 浏览 | PSD 源文件可用性 |

### 2.4 办公室主题素材深挖

> 直接对应知识库 `资源手册 §1.3 重点推荐的办公室主题素材`

| # | 素材名 | 检索查询 | 说明 |
|---|-------|---------|------|
| 2.4.1 | Office Interior Tileset by Donarg | `donarg office tileset itch.io` | $2，已知 Pixel Agents 项目使用 |
| 2.4.2 | Free Office Pixel Art | `free office pixel art itch.io` | 免费办公室素材包 |
| 2.4.3 | 16×16 Office Desk Icons | `office desk icons 16x16 pixel` | 桌面图标多色变体 |
| 2.4.4 | 现代办公室 / 科技公司场景 | `modern tech office pixel tileset` | 非传统 RPG 风的现代办公室 |
| 2.4.5 | 服务器机房 / DevOps 主题 | `server room pixel art data center` | CI/CD 可视化场景素材 |

---

## Phase 3：设计灵感与案例采集

**目标**：收集像素风 Web UI 实际应用案例，提取设计模式

### 3.1 设计灵感平台

| # | 平台 | 检索查询 | 采集内容 |
|---|------|---------|---------|
| 3.1.1 | Dribbble | `pixel art UI` | 截图 + 设计师主页 + 标签分析 |
| 3.1.2 | Dribbble | `8-bit dashboard` | Dashboard 类像素设计 |
| 3.1.3 | Dribbble | `retro game interface web` | 游戏化 Web UI |
| 3.1.4 | Behance | `pixel art web design` | 完整项目案例（含过程稿） |
| 3.1.5 | Pinterest | `retro ui pixel design` | 灵感板聚合（110+ pins） |
| 3.1.6 | Pinterest | `pixel art game UI mockup` | 游戏 UI Mockup 参考 |
| 3.1.7 | 99designs | `pixel design` | 商业像素设计案例 |

### 3.2 像素风网站案例

| # | 检索查询 | 目标 |
|---|---------|------|
| 3.2.1 | `pixel art styled websites examples` | 完整像素风网站合集文章 |
| 3.2.2 | `retro pixel landing page 2025 2026` | 近期上线的像素风 Landing Page |
| 3.2.3 | `pixel art portfolio website developer` | 开发者像素风作品集 |
| 3.2.4 | `8-bit game UI web app` | 游戏化 Web App 案例 |
| 3.2.5 | `site:awwwards.com pixel` | Awwwards 收录的像素风获奖站点 |
| 3.2.6 | `site:csswinner.com pixel retro` | CSS Winner 收录案例 |

**每个案例需提取**：
- 截图（全页 + 关键组件）
- 技术栈识别（通过 Wappalyzer / BuiltWith）
- 设计 token 提取（JS 注入 getComputedStyle）
- 布局结构分析（Grid/Flex/定位方案）
- 调色板提取（限制色数量）
- 字体识别

### 3.3 Figma 社区资源

| # | 检索查询 | 说明 |
|---|---------|------|
| 3.3.1 | `pixel art UI kit` | 已知高质量 Kit（含微交互原型） |
| 3.3.2 | `8-bit design system` | 8-bit 设计系统文件 |
| 3.3.3 | `retro game UI components` | 游戏风 UI 组件库 |
| 3.3.4 | `pixel icon set figma` | 像素图标集 |
| 3.3.5 | `NES SNES UI figma` | 主机风格 UI 参考 |

---

## Phase 4：制作工具链与教程

**目标**：建立像素素材自制能力的知识储备

### 4.1 工具深度教程

| # | 检索查询 | 工具 | 说明 |
|---|---------|------|------|
| 4.1.1 | `Aseprite spritesheet export tutorial 2025` | Aseprite | Spritesheet 导出 + JSON 元数据配置 |
| 4.1.2 | `Aseprite animation state machine game` | Aseprite | 多状态角色动画工作流 |
| 4.1.3 | `Pixelorama tutorial tilemap` | Pixelorama | 免费替代方案 Tilemap 编辑 |
| 4.1.4 | `Piskel spritesheet web browser` | Piskel | 浏览器内快速原型 |
| 4.1.5 | `pixel art photoshop grid setup 2025` | Photoshop | PS 像素绘制配置 |

### 4.2 像素美术技法

| # | 检索查询 | 说明 |
|---|---------|------|
| 4.2.1 | `pixel art color palette theory limited colors` | 限制调色板设计理论 |
| 4.2.2 | `pixel art dithering techniques tutorial` | 抖动技法（渐变/阴影） |
| 4.2.3 | `pixel art sub-pixel animation` | 亚像素动画技法 |
| 4.2.4 | `pixel art UI design principles readability` | 像素 UI 的可读性设计原则 |
| 4.2.5 | `pixel art character animation states idle walk work` | 角色多状态动画设计 |
| 4.2.6 | `pixel art anti-aliasing when to use` | 抗锯齿使用时机（像素风通常禁用） |

### 4.3 AI 辅助像素素材生成

| # | 检索查询 | 说明 |
|---|---------|------|
| 4.3.1 | `AI pixel art generator 2025 2026` | AI 像素画生成工具（Midjourney/DALL-E prompt） |
| 4.3.2 | `stable diffusion pixel art lora model` | SD 像素风 LoRA 模型 |
| 4.3.3 | `gemini image generation pixel art style` | Gemini API 像素风生成（Star-Office-UI 已对接） |
| 4.3.4 | `AI spritesheet generation character` | AI 生成角色 spritesheet 工具 |

---

## Phase 5：状态可视化专项

**目标**：收集与 `资源手册 §二 状态可视化` 直接相关的参考实现

### 5.1 同类项目源码分析

| # | 项目 | 检索查询 | 分析重点 |
|---|------|---------|---------|
| 5.1.1 | Star-Office-UI | `site:github.com ringhyacinth Star-Office-UI` | 状态映射 + Phaser 渲染 + 素材管理 |
| 5.1.2 | Pixel Agents (VS Code) | `pixel agents vscode extension claude code` | BFS 寻路 + 状态机 + JSONL 日志驱动 |
| 5.1.3 | 类似项目发现 | `pixel office visualization agent status github` | 新同类项目 |
| 5.1.4 | Tamagotchi/虚拟宠物仪表盘 | `virtual pet dashboard monitoring gamification` | 游戏化监控参考 |

### 5.2 游戏化监控设计模式

| # | 检索查询 | 说明 |
|---|---------|------|
| 5.2.1 | `gamification dashboard design pattern` | 游戏化仪表盘设计模式 |
| 5.2.2 | `peripheral monitoring UI design ambient display` | 余光监控/环境显示设计 |
| 5.2.3 | `spatial UI state visualization` | 空间即信息的 UI 案例 |
| 5.2.4 | `pixel art status indicator web component` | 像素风状态指示器 Web 组件 |
| 5.2.5 | `CI CD pipeline visualization pixel gamification` | CI/CD 像素化可视化 |

### 5.3 寻路与场景引擎

| # | 检索查询 | 说明 |
|---|---------|------|
| 5.3.1 | `Phaser 3 pixel art office scene tutorial` | Phaser 像素办公室场景搭建 |
| 5.3.2 | `BFS pathfinding 2D grid JavaScript` | 2D 网格 BFS 寻路实现 |
| 5.3.3 | `Phaser spritesheet animation state machine` | Phaser 精灵动画状态机 |
| 5.3.4 | `canvas pixel art rendering scale integer` | Canvas 整数缩放像素完美渲染 |

---

## Phase 6：趋势追踪与持续更新

**目标**：建立像素风设计趋势的持续监测机制

### 6.1 定期检索（月度）

| # | 检索查询 | 平台 | 说明 |
|---|---------|------|------|
| 6.1.1 | `pixel art UI` 按时间排序 | Dribbble | 新作品追踪 |
| 6.1.2 | `8bitcn` / `pixelact-ui` | GitHub releases | 组件库更新 |
| 6.1.3 | `pixel art` tag 最新上传 | itch.io | 新素材包 |
| 6.1.4 | `retro pixel web design` | DEV.to / Medium | 社区文章与教程 |
| 6.1.5 | `shadcn pixel retro` | ui.shadcn.com/docs/directory | 新 registry 收录 |

### 6.2 关键信号监测

| 信号 | 监测方式 | 触发动作 |
|------|---------|---------|
| 8bitcn 发布新组件 | GitHub watch + RSS | 更新扩充清单 §四 |
| 新像素风 shadcn registry 出现 | shadcn directory 月度扫描 | 评估并归档 |
| Figma Community 高星像素 Kit | 按评分排序月度检索 | 下载 + token 提取 |
| 像素风 Web 设计获奖 | Awwwards / CSSDA 监测 | 案例分析入库 |
| AI 像素生成工具重大更新 | Midjourney / SD changelog | 更新 §4.3 |

---

## 执行优先级总览

| Phase | 预估工作量 | 依赖 | 优先级 | 建议启动时间 |
|-------|-----------|------|--------|------------|
| **P0** | 0.5d | 无 | P0 | 立即 |
| **P1** 组件库 | 1d | P0 | P0 | 与 P0 并行 |
| **P2** 美术素材 | 2-3d | P0 | P1 | P0 完成后 |
| **P3** 设计灵感 | 1-2d | P0 | P1 | 与 P2 并行 |
| **P4** 工具链教程 | 1d | 无 | P2 | 按需 |
| **P5** 状态可视化 | 1-2d | P1 | P1 | P1 完成后 |
| **P6** 趋势追踪 | 持续 | P0-P5 | P3 | 首轮完成后启动 |

---

## 检索执行规范

### 查询构造原则

- **核心词 + 限定词**：`pixel art` + 场景/类型/年份
- **平台限定**：`site:itch.io` / `site:github.com` / `site:figma.com`
- **时间限定**：加 `2025` 或 `2026` 过滤过时内容
- **许可证过滤**：itch.io 支持 Free 标签筛选；OpenGameArt 支持协议筛选

### 单次检索产出模板

```yaml
resource:
  name: ""
  source_url: ""
  platform: ""           # itch.io / GitHub / Figma / Dribbble / ...
  category: ""           # 对应 taxonomy 分类
  license: ""            # CC0 / CC-BY / MIT / 非商用 / 付费($X)
  format: []             # PNG / Aseprite / JSON / SVG / Figma / JSX
  pixel_spec:
    size: ""             # 16x16 / 32x32 / 64x64 / custom
    palette_colors: 0    # 调色板颜色数
    animation_states: [] # idle / walk / work / error / ...
    frame_count: 0
  quality_score: 0       # 1-5 主观评分
  tags: []
  notes: ""
  retrieved_at: ""
  sha256: ""             # 文件级去重
```

### 与知识库文档的同步规则

| 检索产出 | 更新目标文档 | 更新方式 |
|---------|------------|---------|
| 新 shadcn 组件库 | `shadcn-ui组件库扩充资料清单.md` §四 | 追加行 |
| 新素材平台/素材包 | `像素风UI与状态可视化前端资源手册.md` §1.3 | 追加行 |
| 新同类项目 | `像素风UI与状态可视化前端资源手册.md` §2.6 | 追加行 |
| 新设计模式/案例 | 新建 `像素风设计案例库.md` | 结构化归档 |
| 新动效技法 | `前端设计借鉴分析.md` 相关章节 | 追加段落 |

---

> **版本**：v1.0 | **日期**：2026-03-07 | **状态**：待执行

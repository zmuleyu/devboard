# DevBoard Phase 5 — 项目协调与管理增强

## Context

DevBoard 已完成 Phase 1-4（5个模块 + 数据管道 + CI + 定时同步），具备项目健康监控和会话分析能力。但缺少：

1. **项目时间线管理** — 无法看到各项目的计划区间、是否超期、相互之间的时间冲突
2. **进度追踪** — `topTodo` 是单行文字，无法表达里程碑进度
3. **视觉预警** — 健康下滑、长期无提交等异常需要主动打开 PortfolioGrid 才能发现
4. **规划中项目** — 只有 active 项目，无法管理"打算做但还没开始"的项目

Phase 5 通过新增 AlertBanner + RoadmapGantt 两个组件解决以上问题。

---

## 设计决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 通知方式 | 仪表板内视觉预警（方案A） | 纯静态 app，无后端；用户主动打开查看，视觉预警足够 |
| 进度表形式 | 8周滚动甘特图（方案B1） | 聚焦当前窗口，数据维护量最小，与 Timeline 热图互补 |
| 规划项目数据源 | portfolio-data.json status 字段（方案C） | 与现有数据层一致，无新基础设施 |
| 详情面板内容 | 只含甘特独有信息（时间线/里程碑/依赖/备注） | 避免与 ProjectCard 重复 |

---

## 数据 Schema 扩展

### `src/types.ts` 修改

**修复 HealthGrade 类型**（现有定义缺少 `'B'` 和 `'C-'`，但 ProjectTasks.tsx healthColors 已在使用）：

```typescript
export type HealthGrade = 'A' | 'A-' | 'B' | 'B-' | 'C' | 'C-';
```

**新增类型定义：**

```typescript
export type ProjectLifecycle = 'active' | 'planned' | 'paused' | 'completed';

export interface ProjectTimeline {
  start: string;   // "2026-03-01"
  target: string;  // "2026-04-30"
}

export interface ProjectMilestone {
  label: string;
  date: string;
  done: boolean;
}
```

**在现有 `ProjectStatus` interface 末尾追加可选字段**（不重新声明，直接在原 interface 里加）：

```typescript
export interface ProjectStatus {
  // ...existing 13 fields unchanged...
  status?: ProjectLifecycle;          // default: 'active'
  timeline?: ProjectTimeline;
  milestones?: ProjectMilestone[];
  dependencies?: string[];
  notes?: string;
}
```

### `portfolio-data.json` 兼容性

- 现有 8 个 active 项目 **无需任何改动**（`status` 缺省即 `active`）
- 只有需要 Gantt 条的项目才需填 `timeline`
- `milestones`、`dependencies`、`notes` 均可选
- **初始数据要求：** 实现时为所有 8 个现有项目补充 `timeline` 字段（从 git log 推断 start，target 按 topTodo 估算），确保 Gantt 图首次加载不为空
- planned 项目示例：

```json
{
  "name": "new-project",
  "ecosystem": "standalone",
  "status": "planned",
  "timeline": { "start": "2026-04-01", "target": "2026-06-30" },
  "topTodo": "完成技术选型",
  "milestones": [
    { "label": "技术选型", "date": "2026-04-05", "done": false }
  ],
  "notes": "前置条件：pixel-herbarium MVP 完成后再启动",
  "health": "B-", "healthTrend": "→", "testCount": 0,
  "techDebtMarkers": 0, "lastCommitDate": "", "lastCommitMessage": "",
  "branch": "", "uncommittedChanges": 0, "path": ""
}
```

---

## 组件设计

### 1. AlertBanner

**文件：** `src/components/AlertBanner.tsx`（~80行）

**位置：** App.tsx 中 Header 与第一条 pixel-divider 之间

**预警规则（纯派生，无需新数据）：**

| 规则 | 条件 | 级别 |
|------|------|------|
| 健康下滑 | `healthTrend === '↓'` | warning |
| 长期无提交 | `daysSince(lastCommitDate) > 14` | warning |
| 目标超期 | `timeline.target < today` 且 `status !== 'completed'` | error |
| 接近超期 | `timeline.target` 在7天内 | warning |
| 未提交变更多 | `uncommittedChanges >= 5` | warning |

**UI 行为：**

- 无预警时不渲染（零占位）
- 有预警时默认折叠，显示"⚠ N 项需关注"摘要行
- 点击展开显示预警列表，每条含：项目色标 + 项目名 + 具体消息
- error 用 `#ef4444`，warning 用 `#fbbf24`
- 样式：`pixel-border` + `bg-card-bg`

**数据来源：** `usePortfolioData()` — 无需新 hook

**与 selectedProject 的关系：** AlertBanner **始终显示所有预警**，不受 selectedProject 筛选影响（预警是全局概览，不应被项目选择隐藏）

---

### 2. RoadmapGantt

**文件：** `src/components/RoadmapGantt.tsx`（~180行）

**位置：** App.tsx 中 ProjectTasks 下方（Module 6）

**布局：**

```
┌─────────────────────────────────────────────────────────────┐
│ [section-title] 项目路线图                                    │
│ [section-desc]  8周滚动视窗 · 点击项目行查看详情                │
│                                                              │
│ [legend] 进行中 | 超期 | 规划中 | 已完成 | │今天               │
│                                                              │
│         02/22  03/01  03/08  *03/15*  03/22  03/29  04/05    │
│ ── CYBERNIUM ─────────────────────────────────────           │
│ cyber-landing  [████ 已部署 ████]                │            │
│ ai_projects    [███████ KR内容建设 ███████]       │            │
│ ── ZIYOU ─────────────────────────────────────               │
│ ziyou-server   [████ 维护 ████]                  │            │
│ ── STANDALONE ────────────────────────────────               │
│ pixel-herb           [╌╌╌ MVP 核心循环 ╌╌╌]      │            │
│                                            今天竖线│           │
│                                                              │
│ ┌── 展开详情面板 (点击行触发) ──┐                              │
│ │ 时间线: 02/20 → 04/05 剩余21天 │                             │
│ │ 里程碑: ✓ v1.30.0 ✓ M093 ● 补测试 □ KR  │                   │
│ │ 依赖: → cyber-landing                   │                   │
│ │ 备注: 双轨部署 / 发版规则 / ...          │                    │
│ └──────────────────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

**技术实现：**

- **纯 div + CSS**，不使用 Recharts（甘特图非标准图表类型）
- 条的 `left%` / `width%` 从 `timeline.start` / `timeline.target` 计算，相对8周窗口
- 8周窗口 = `today - 28天` ~ `today + 28天`，每次渲染动态计算
- 今天竖线 = `position: absolute`，left 按当前日期百分比
- 甘特行右侧显示 `health-badge` + `role` 元信息

**颜色规则：**

- 进行中：`projectColor(name)`（来自 `src/theme.ts`）
- 超期：`#ef4444`（health-red）
- 已完成 / 维护模式：项目色 + `opacity: 0.5`
- 规划中：虚线边框 `dashed`，无填充
- 暂停：`#9ca3af`（灰色）+ `opacity: 0.4`

**交互：**

- 点击行展开/收起详情面板
- Hover 显示 tooltip（项目名 + 起止日期 + 剩余天数）
- `selectedProject` prop 联动（非选中项 opacity 0.3，与其他模块一致）
- 甘特条内显示当前阶段标签文字

**无 timeline 项目的处理：** 没有 `timeline` 字段的项目**不显示甘特条**，但仍以项目行形式出现（名称 + health badge + "未设置时间线"灰色文字）。这样用户能看到哪些项目还没有规划。

**详情面板（展开后）：**

仅包含 ProjectCard 中没有的信息：

1. **时间线**：起止日期 + 剩余/超期天数
2. **里程碑清单**：checkbox + 标签 + 日期，来自 `milestones` 字段
3. **项目依赖**：箭头 + 关联项目名称，来自 `dependencies` 字段
4. **开发备注**：自由文本，来自 `notes` 字段

**可选字段缺省规则：** `milestones`/`dependencies`/`notes` 为 `undefined` 或空数组时，对应 section 整块不渲染（不显示空标题）

---

## 改动文件清单

| 文件 | 类型 | 内容 |
|------|------|------|
| `src/types.ts` | 修改 | 新增 ProjectLifecycle、ProjectTimeline、ProjectMilestone 类型 |
| `src/components/AlertBanner.tsx` | 新建 | 预警横幅组件（~80行） |
| `src/components/RoadmapGantt.tsx` | 新建 | 甘特图模块（~180行） |
| `src/App.tsx` | 修改 | 插入 AlertBanner + RoadmapGantt + pixel-divider |
| `src/data/portfolio-data.json` | 修改 | 所有项目添加 timeline，部分添加 milestones/notes |
| `src/utils/format.ts` | 修改 | 提取 `daysSince()` 工具函数（AlertBanner + ProjectCard 共用） |

**不改动：** ProjectCard、PortfolioGrid、theme.ts（复用 projectColor）、其他现有组件

**版本号：** App.tsx footer 从 `v0.2.0` 更新为 `v0.3.0`

---

## 复用现有代码

- `projectColor(name)` — `src/theme.ts:25`
- `ECOSYSTEM_LABELS` — `src/theme.ts:29`
- `usePortfolioData()` — `src/hooks/usePortfolioData.ts`
- `pixel-border` / `pixel-divider` CSS — `src/index.css`
- `ecosystemOrder` 分组模式 — 参照 `ProjectTasks.tsx:14`（两处重复，暂不合并，保持改动最小）
- `daysAgo()` — `ProjectCard.tsx` 已有类似逻辑，提取为共享 `daysSince()` 到 `src/utils/format.ts`

---

## 验证方式

1. `npm run build` — TypeScript 编译无错误
2. 本地 `npm run dev` — 打开 DevBoard，确认：
   - AlertBanner 在有预警时显示、可折叠展开
   - AlertBanner 无预警时完全不渲染
   - RoadmapGantt 显示所有项目行，今天竖线位置正确
   - 点击行可展开/收起详情面板
   - 里程碑/依赖/备注正确显示
   - `selectedProject` 联动（点击 PortfolioGrid 中的项目，Gantt 中非选中项变暗）
3. 浏览器 mockup 对照：`file:///D:/projects/devboard/.superpowers/brainstorm/992620-1773554693/gantt-mockup-v3.html`

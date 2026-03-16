# DevBoard v1.0 — 重构设计文档

## Context

DevBoard 当前 v0.8.0，14 模块 / 4 Tab（Portfolio/DevOps/Analytics/Knowledge），纯静态 JSON 数据 + 构建时注入。用户需要从"便于管理和查看"的角度优化，重点实现：

1. 项目进度总览及具体情况
2. 定时任务管理
3. 日/周/月 token 消耗总览和详情
4. 项目组成与备份（灾难恢复 + 效率规划）

**核心问题**：现有 Tab 划分与实际需求不完全匹配（尤其 Knowledge Tab 是静态 Claude.ai 归档，而非项目管理）；部分模块重叠冗余；缺少灾难恢复指引和使用周期规划。

---

## Architecture Overview

### Tab 重组

| Tab | 新名称 | 模块数 | 来源 |
|-----|--------|--------|------|
| Tab 1 | 项目总览 | 2 | 原 Portfolio（精简） |
| Tab 2 | 定时任务 | 2 | 原 DevOps（合并精简） |
| Tab 3 | 用量分析 | 3 层 | 原 Analytics（精简 + 折叠详情） |
| Tab 4 | 项目档案 & 恢复 | 4 | 原 Knowledge（大幅重构） |

### 模块变更汇总

| 变更类型 | 模块 |
|----------|------|
| **保留不改** (3) | RoadmapGantt, SessionLog, UsageDashboard |
| **增强** (3) | PortfolioGrid(drill-down), TokenAnalytics(USD+时间粒度), BudgetForecast(月度) |
| **合并** (4→2) | TaskStatusPanel+CronDashboard→TaskManager, AgentTimeline+OffPeakMetrics→移除 |
| **移动** (2) | Timeline→Tab3 折叠, ProjectTasks→合并进 ProjectDetail |
| **新增** (6) | StatusStrip, ProjectDetail, TaskManager, ExecutionLog(替代AgentLogViewer), ProjectRegistry, RecoveryGuide+CyclePlanner |
| **折叠** (3) | KnowledgeArchive, ConversationTimeline, TopicSummaries |
| **移除** (1) | OffPeakMetrics(ExecutionView) — 实用性低 |

---

## Tab 1: 项目总览

### 布局（从上到下）

1. **RoadmapGantt**（置顶）
   - 8 周滚动甘特图，一眼看各项目进度
   - 生态颜色编码：amber=Cybernium, indigo=Ziyou, emerald=Standalone
   - 当前周高亮
   - 文件：`src/components/RoadmapGantt.tsx`（现有，不改）

2. **StatusStrip**（新增）
   - 4 个指标卡片，水平排列：
     - **待办事项**：跨项目 TODO 聚合数，点击展开列表
     - **Cron 活跃**：Ready/Total 比例 + 下次执行时间，点击跳 Tab 2
     - **今日 Token**：当日累计 + USD 估算，点击跳 Tab 3
     - **需关注**：未 push commit + 告警计数，展开 AlertBanner
   - AlertBanner 只在有告警时显示（条件渲染，可折叠）
   - 数据源：portfolio-data.json + cron-log.json + token-daily.json
   - 文件：`src/components/StatusStrip.tsx`（新建）

3. **PortfolioGrid + ProjectDetail**（增强）
   - Ecosystem filter tabs：全部 / Cybernium / Ziyou / Standalone
   - 项目卡片网格：名称 + 健康等级 + 测试数 + 版本 + mini 趋势线
   - 卡片按生态分组 + 未提交变更徽标
   - 点击卡片展开 **ProjectDetail** 面板（在卡片网格下方内联展开）：
     - 技术栈标签
     - 部署链接（可点击）
     - 测试状态
     - Git 状态 + remote sync
     - 待办事项列表（原 ProjectTasks 的 TODO 合并至此）
     - 近 4 周 commit 活跃度 mini 柱状图
     - 最后 session 时间
   - 文件：`src/components/PortfolioGrid.tsx`（修改）、`src/components/ProjectDetail.tsx`（新建）

### 移除/移出

- **ProjectTasks**：TODO 合并进 ProjectDetail，commit 柱状图与 ProjectDetail 重复 → 移除
- **Timeline**：移至 Tab 3 折叠详情区

---

## Tab 2: 定时任务

### 布局（从上到下）

1. **Summary Strip**（顶部薄条）
   - 一行信息：任务 3 活跃/8 总 · 通过率 87% (7天) · 日均费用 ~$0.90 · ⚠ 告警
   - 失败任务高亮红色

2. **TaskManager**（合并 TaskStatusPanel + CronDashboard）
   - **左列**：任务列表（垂直排列）
     - 失败任务排在最前（红色脉冲动画）
     - Ready 任务绿色指示灯
     - Disabled 任务灰色 + 折叠 (+N more)
   - **右侧**：选中任务的详情面板
     - 🎯 **目标**：任务的目的和价值说明
     - ⚙️ **执行方式**：命令 + 输出 + 超时 + 预算
     - 📅 **执行计划说明**：为什么选这个时间，实际 vs 计划偏差
     - 📊 **执行统计**：7 天通过率 + 平均耗时 + Token/次 + 连续成功/失败数
     - 7 天执行热力图（pass/fail 小方块）
     - 下次执行倒计时
   - 数据源：claude-cron/config.json（任务配置）+ cron-log.json（执行历史）+ task-config.json（手动维护的目标/计划说明）
   - 注意：任务"目标"和"执行计划说明"为手动维护字段，存储在 task-config.json 中
   - 文件：`src/components/TaskManager.tsx`（新建，替代 CronDashboard + TaskStatusPanel 概念）

3. **ExecutionLog**（增强版 AgentLogViewer）
   - 日期选择器 + 结果筛选（全部 / 仅失败）
   - 日志条目分级展示：
     - **FAIL**：红色边框 + 展开错误详情 + 建议操作（链接到 runbook）
     - **WARN**：黄色边框 + 警告内容
     - **PASS**：绿色边框 + 一行摘要
   - 每条显示：时间 · 任务名 · 结果 · 执行时长 · Token 消耗
   - **导出功能**：Markdown/JSON 报告导出，含日期范围选择
   - **优化建议**：基于执行历史自动提示（如"连续 30 天未启用，建议移除"）
   - 数据源：cron-log.json + agent-logs/*.md
   - 文件：`src/components/ExecutionLog.tsx`（新建，替代 AgentLogViewer）

### 移除

- **AgentTimeline** + **OffPeakMetrics**：合并为 ExecutionView 后仍实用性低 → 移除
- 关键指标（off-peak 比例、总通过率、日均费用）提取到 Summary Strip

---

## Tab 3: 用量分析

### 布局（3 层结构）

**第 1 层：大数字卡片**（顶部）
- 3 个大卡片：今日 / 本周 / 本月
- 每个卡片显示：Token 总量（大字）+ USD 估算 + 趋势箭头（vs 上一周期）
- 点击卡片切换下方图表的时间粒度
- 预算进度条：周 + 月双行，含 USD
- **项目用量面板**（直接展示，不折叠）：各项目 token 消耗横向柱状图 + 占比 + USD，按用量排序
- 预算信息仅作参考，视觉权重低于项目用量

**第 2 层：趋势图**
- 一个图表，模型堆叠柱状（haiku/sonnet/opus）
- 时间粒度随大卡片切换（日→7 天柱状 / 周→4 周 / 月→6 月）
- Legend 含模型单价：Haiku $0.25/M · Sonnet $3/M · Opus $15/M
- 文件：`src/components/TokenAnalytics.tsx`（修改）

**第 3 层：折叠详情**（默认收起）
- 📁 按项目分布（已在第 1 层展示简版，这里是完整版含 per-session 细分）
- 🕐 Session 历史（原 SessionLog）
- 📊 活跃时间热力图（原 UsageDashboard + 移入的 Timeline）
- 🔮 预算预测 WMA（原 BudgetForecast）
- 文件：原有组件保留，包裹在 collapsible section 中

### USD 计算

- 新建 `src/utils/cost.ts`
- 模型单价常量（可配置）：`{ haiku: 0.25, sonnet: 3, opus: 15 }` ($/M tokens)
- `calcCost(tokens: number, model: string): number`
- `calcDailyCost(entry: TokenDailyEntry): { total, byModel }`

### 时间聚合

- 新建 `src/utils/aggregate.ts`
- `aggregateByWeek(dailyData): WeeklyEntry[]`
- `aggregateByMonth(dailyData): MonthlyEntry[]`

---

## Tab 4: 项目档案 & 恢复

### 定位

不是状态展示，而是**行动指引**：告诉你该做什么来确保项目可恢复、可接续。

### 布局（从上到下）

1. **恢复指引**（Actionable Checklist）
   - 标题："确保项目可恢复 — 你还需要做这些"
   - 待完成事项列表（按紧急度排序）：
     - 🔴 "ziyou-server 有 3 个未 push commits → 执行 `cd D:/projects/ziyou-server && git push`"
     - 🟡 "gaming-compliance 无 remote → 创建 GitHub repo 并 push"
     - 🟡 "4 个项目缺少 CLAUDE.md → 新 session 无法快速理解上下文"
   - 已完成事项折叠显示（✅ 14/18 有 CLAUDE.md · ✅ Memory 完整 · ✅ Skills 已备份）
   - 恢复包状态：MEMORY.md + CLAUDE.md + settings.json + Skills + MCP 配置
   - 数据源：scan-projects.sh 扫描结果
   - 文件：`src/components/RecoveryGuide.tsx`（新建）

2. **使用周期规划**
   - 5h 窗口进度条：开始时间 → 当前位置 → 刷新时间
   - 周期检测逻辑：从 usage-log.json 的最近 session start 事件推算当前周期起点（当日最早 session start，或上一个 5h 窗口起点）
   - 剩余 token 预估：基于当日已用 token 和 5h 窗口剩余时间
   - 各项目 session 平均 token 消耗表：项目 · 平均/session · 常用模型 · 适合度（可做/紧张/不够）
   - "适合度"计算：项目平均 session token ÷ 剩余预估 token，<50% 可做 / 50-80% 紧张 / >80% 不够
   - 帮助决策"剩余时间做哪个项目最合适"
   - 数据源：usage-log.json + token-daily.json + sessions-log.json
   - 文件：`src/components/CyclePlanner.tsx`（新建）

3. **项目管理概览**
   - 每个项目展示：
     - **类型**：Web App / Chrome 扩展 / 移动 App / CLI 工具 / MCP 服务 / 静态站
     - **核心内容**：技术栈标签 + 主要功能一句话描述
     - **当前进度**：最新版本 + 当前阶段 + 待办数
     - **如何在新环境搭建**：`git clone URL` + 依赖安装命令 + 启动命令
     - **无缝衔接信息**：当前正在做什么 + PROGRESS.md 状态 + 关键上下文
   - 表格视图，点击行展开详情
   - Ecosystem filter
   - 数据源：project-registry.json（auto-scan + manual）
   - 文件：`src/components/ProjectRegistry.tsx`（新建）

4. **历史归档**（底部折叠）
   - 原 Knowledge 3 模块：KnowledgeArchive + ConversationTimeline + TopicSummaries
   - 默认折叠，点击"历史归档 (2,421 docs · 687 对话)"展开
   - 代码不改，只包裹在 collapsible 中

---

## Data Layer Changes

### 新增数据文件

| 文件 | 内容 | 生成方式 |
|------|------|----------|
| `src/data/project-registry.json` | 18 个项目的完整档案 | scan-projects.sh 自动 + 手动补充 |
| `src/data/task-config.json` | 8 个 cron 任务配置详情 | 从 claude-cron/config.json 同步 |

### 新增脚本

| 脚本 | 功能 |
|------|------|
| `scripts/scan-projects.sh` | 扫描 18 个项目目录：package.json/pyproject.toml → 技术栈, git remote → 备份, git status → 未 push, docs/ → 文档清单, test files → 测试数 |

### 数据文件迁移

- **关键变更**：数据文件从 `src/data/` 迁移到 `public/data/`
  - `src/data/*.json` → `public/data/*.json`（静态资源，不经 Vite 打包）
  - `src/data/agent-logs/` → `public/data/agent-logs/`
  - sync-data.sh 输出目标更新为 `public/data/`
  - 旧 `src/data/` 目录保留静态类型定义文件

### Hook 升级

- 所有 9 个 hook 从 `import data from './data/xxx.json'`（静态）改为：
  ```ts
  const [data, setData] = useState<T[]>([]);
  useEffect(() => {
    fetch('/data/xxx.json').then(r => r.json()).then(setData);
  }, []);
  ```
- 添加 `visibilitychange` 监听：页面获得焦点时自动刷新数据
- `public/data/` 作为 Vite 静态资源目录，sync 脚本直接写入

### 新增工具函数

| 文件 | 函数 |
|------|------|
| `src/utils/cost.ts` | `calcCost()`, `calcDailyCost()`, `MODEL_PRICES` |
| `src/utils/aggregate.ts` | `aggregateByWeek()`, `aggregateByMonth()` |

---

## Tab Configuration

更新 `src/config/tabs.ts`：

```ts
export const TABS = [
  { id: 'projects', label: '项目总览', icon: '📊' },
  { id: 'tasks',    label: '定时任务', icon: '⏰' },
  { id: 'usage',    label: '用量分析', icon: '📈' },
  { id: 'registry', label: '项目档案', icon: '📁' },
];
```

更新 `src/components/tabs/`：
- `PortfolioTab.tsx` → `ProjectsTab.tsx`
- `DevOpsTab.tsx` → `TasksTab.tsx`
- `AnalyticsTab.tsx` → `UsageTab.tsx`
- `KnowledgeTab.tsx` → `RegistryTab.tsx`

---

## Files to Modify

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/config/tabs.ts` | 修改 | Tab 配置重命名 |
| `src/App.tsx` | 修改 | lazy import 路径更新 |
| `src/components/tabs/*.tsx` | 修改 | 4 个 Tab 容器重命名 + 内容重组 |
| `src/components/PortfolioGrid.tsx` | 修改 | 增加 drill-down + ecosystem filter |
| `src/components/TokenAnalytics.tsx` | 修改 | 增加 USD + 时间粒度切换 |
| `src/components/BudgetForecast.tsx` | 修改 | 增加月度预算 |
| `src/hooks/*.ts` | 修改 | 静态 import → useEffect fetch |

## Files to Create

| 文件 | 说明 |
|------|------|
| `src/components/StatusStrip.tsx` | Tab 1 状态条 |
| `src/components/ProjectDetail.tsx` | Tab 1 项目详情 drill-down |
| `src/components/TaskManager.tsx` | Tab 2 任务管理器 |
| `src/components/ExecutionLog.tsx` | Tab 2 执行日志（替代 AgentLogViewer） |
| `src/components/tabs/TasksTab.tsx` | Tab 2 容器（含 Summary Strip 内联） |
| `src/components/RecoveryGuide.tsx` | Tab 4 恢复指引 |
| `src/components/CyclePlanner.tsx` | Tab 4 使用周期规划 |
| `src/components/ProjectRegistry.tsx` | Tab 4 项目管理概览 |
| `src/utils/cost.ts` | USD 费用计算 |
| `src/utils/aggregate.ts` | 时间聚合（周/月） |
| `scripts/scan-projects.sh` | 项目目录自动扫描 |
| `src/data/project-registry.json` | 项目档案数据 |
| `src/data/task-config.json` | 任务配置数据 |

## Files to Remove/Deprecate

| 文件 | 处理 |
|------|------|
| `src/components/ProjectTasks.tsx` | 移除（合并进 ProjectDetail） |
| `src/components/AgentTimeline.tsx` | 移除（低实用性） |
| `src/components/OffPeakMetrics.tsx` | 移除（关键指标提取到 Summary Strip） |

---

## Verification

1. **构建验证**：`pnpm build` 通过，TSC 零错误
2. **视觉验证**：
   - Tab 1：Gantt → StatusStrip → Grid，点击卡片展开 Detail
   - Tab 2：TaskManager 左列选任务右侧显详情，LogViewer 失败高亮
   - Tab 3：3 大数字 → 项目用量 → 趋势图 → 折叠详情
   - Tab 4：恢复指引 → 周期规划 → 项目概览 → 归档折叠
3. **数据流验证**：`pnpm sync` → 数据更新 → 刷新页面 → 数据展示正确
4. **部署验证**：push master → Vercel 自动部署 → devboard.cybernium.cn 可访问

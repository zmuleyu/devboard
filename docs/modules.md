# DevBoard 模块参考 (v0.6.0+)

**14 个模块 · 5 个功能组 · 10 个数据文件**

部署地址：`devboard-jade.vercel.app`
数据目录：`~/.claude/data/` → `src/data/`（每日同步）

---

## 一、项目健康（4 个模块）

| # | 模块名 | 组件文件 | 数据源 | 功能简述 |
|---|--------|---------|--------|---------|
| 1 | Portfolio Overview | `PortfolioGrid.tsx` | `portfolio-data.json` | 项目总览网格（生态系统分组）· 健康等级 A-C · git 状态 · 可点击过滤 |
| 12 | Timeline | `Timeline.tsx` | `sessions-log.json` + `portfolio-data.json` | 项目×日期热力时间线 · 颜色=模型 · 大小∝会话数 · 横向滚动 |
| 13 | Project Tasks | `ProjectTasks.tsx` | `portfolio-data.json` + `portfolio-history.json` | 各项目 TODO 清单 + 4 周提交活动堆积柱状图 |
| 14 | Roadmap Gantt | `RoadmapGantt.tsx` | `portfolio-data.json` | 8 周滚动甘特图 · 状态色（active/overdue/planned/completed）· 里程碑展开面板 |

---

## 二、Token 消耗（4 个模块）

| # | 模块名 | 组件文件 | 数据源 | 功能简述 |
|---|--------|---------|--------|---------|
| 2 | Token Analytics | `TokenAnalytics.tsx` | `token-daily.json` | 每日消耗趋势折线 · 模型堆积柱 · 项目分布环形图 · 周预算进度条 |
| 3 | Budget Forecast | `BudgetForecast.tsx` | `token-daily.json` | WMA 加权移动平均预测 · 累积曲线+±20%置信带 · 趋势检测（ACCELERATING/STEADY/DECELERATING）· 三状态卡片（ON TRACK / CAUTION / OVER BUDGET） |
| 4 | Session Log | `SessionLog.tsx` | `sessions-log.json` | 开发会话历史 · 模型/项目过滤 · 时长+tokens+提交数 |
| 9 | Usage Dashboard | `UsageDashboard.tsx` | `usage-log.json` | 24h 使用热力图 · 星期分布柱状图 · 模型分布 · 5h 滑动窗口 |

---

## 三、Agent 自动化（4 个模块）

| # | 模块名 | 组件文件 | 数据源 | 功能简述 |
|---|--------|---------|--------|---------|
| 5 | Cron Dashboard | `CronDashboard.tsx` | `cron-log.json` + `health-status.json` | 定时任务执行历史 · 7 天 pass rate 热力图 · source badge（⏰/📌/💬/🔁）· 错峰标记 |
| 6 | Agent Log Viewer | `AgentLogViewer.tsx` | `agent-logs/*.md` | 日期切换 · 结果过滤（pass/fail/warn/info）· 日摘要卡片 |
| 7 | 24H Agent Timeline | `AgentTimeline.tsx` | `cron-log.json` | 24h 散点图 · 蓝色错峰窗口（01:00-07:00）· 气泡大小=时长 · 7 天窗口 |
| 8 | Off-Peak Metrics | `OffPeakMetrics.tsx` | `cron-log.json` | 错峰利用率环形图 · 7 天趋势堆积图 · 2× credits 节省估算 |

---

## 四、知识资产（2 个模块）

| # | 模块名 | 组件文件 | 数据源 | 功能简述 |
|---|--------|---------|--------|---------|
| 10 | Knowledge Archive | `KnowledgeArchive.tsx` | `migration-report.json` | 文档迁移统计 · 项目文档量分布饼图 · 文件类型分布 · 重复追踪 |
| 11 | Conversation Timeline | `ConversationTimeline.tsx` | `conversation-stats.json` | 687 个对话 · 主题分布（10 类）· 每日活跃度堆积图 |

---

## 数据文件清单

| 文件 | 格式 | 更新方式 | 大小参考 |
|------|------|---------|---------|
| `portfolio-data.json` | JSON snapshot | 手动 / DailySync | ~18 项目 |
| `portfolio-history.json` | JSON array | DailySync | ~4周历史 |
| `sessions-log.json` | JSON array | DailySync | 每会话一条 |
| `token-daily.json` | JSON array | DailySync | 每天一条 |
| `cron-log.json` | JSON array | 任务执行后 | 每次执行一条 |
| `usage-log.json` | JSON array | SessionStart hook | 每次开关各一条 |
| `agent-logs/*.md` | Markdown | cron 任务写入 | 每任务一行 |
| `migration-report.json` | JSON | 一次性迁移 | 2421 行 |
| `conversation-stats.json` | JSON | 一次性分析 | 362 行 |
| `health-status.json` | JSON | HealthCheck 任务 | 单行快照 |
| `config.json` | JSON | 手动 | 2 个配置项 |

---

## 支撑组件

| 组件 | 作用 |
|------|------|
| `AlertBanner.tsx` | 扫描健康降级↓ / 超期 timeline / 未提交变更 / >14 天无提交 |
| `ProjectCard.tsx` | 单项目卡片 · 健康仪表盘 · 测试数 · 分支 · 待办 · 趋势迷你图 |

---

## 技术栈

- **React 19** + **TypeScript 5.9** + **Vite 8**
- **Tailwind CSS v4** · 像素风自定义主题（Press Start 2P + JetBrains Mono）
- **Recharts 3.8**：AreaChart / BarChart / PieChart / ScatterChart / LineChart

---

*最后更新：2026-03-16 · DevBoard v0.6.0 · master `3d4dc1e`*

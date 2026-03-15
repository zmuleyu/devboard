# DevBoard 全天候 Agent 自动化 + 日志防丢失系统

## Context

**问题**：自主 Agent 最怕的事——跑了一整晚，第二天发现什么都没记下来。当前基础设施有 3 个缺口：
1. **无持久日志**：session 内的 /loop 执行结果随 session 关闭而消失
2. **无自动 checkpoint**：Agent 编辑的代码在意外中断时可能丢失
3. **claude-cron 功能单一**：仅做 tsc-check，未利用错峰双倍优势
4. **DevBoard 缺少 Agent 活动可视化**：CronDashboard 是静态展示，缺少 24h 视图和日志查看

**目标**：构建全天候覆盖的 Agent 自动化系统——白天 autopilot 辅助开发 + 夜间错峰无人值守执行，所有活动持久记录、自动 checkpoint、DevBoard 统一展示。

**方案**：分 3 个 Phase 递进实现，每个 Phase 独立可用。

---

## Phase 1：日志基础设施 + Auto-Checkpoint

### 1.1 Agent Logs 目录

**位置**：`~/.claude/agent-logs/`（全局）

**文件命名**：`YYYY-MM-DD.md`

**文件格式**：
```markdown
# Agent Log — 2026-03-16

## 执行记录
[02:30] patrol:tsc-check | pass | ai_projects: 0 errors
[02:35] patrol:test-suite | pass | pixel-herbarium: 165 tests
[02:40] patrol:tsc-check | fail | ziyou-server: 2 type errors in auth.ts
[09:15] /loop tsc-check | pass | devboard: 0 errors

## 每日摘要
- 总执行: 4 | 通过: 3 | 失败: 1
- 错峰任务: 3 (01:00-07:00)
- 白天任务: 1 (09:00-18:00)
- 关键问题: ziyou-server auth.ts type errors
```

### 1.2 CLAUDE.md 追加日志规范

**文件**：`~/.claude/CLAUDE.md`（追加以下内容）

```markdown
## Agent Log 规范
- 日志目录：`~/.claude/agent-logs/`
- 文件命名：`YYYY-MM-DD.md`（取当天日期）
- 每次 /loop 或 cron 任务执行后，追加一条记录：
  `[HH:MM] 任务名 | 结果(pass/fail/warn/info) | 详情`
- 同时追加到 `~/.claude/data/cron-log.jsonl`（DevBoard 数据源）
- 每日最后一个任务执行后生成当天摘要
```

### 1.3 PostToolUse Auto-Checkpoint Hook

**文件**：`~/.claude/settings.json`（在现有 hooks 中添加）

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/auto-checkpoint.sh"
          }
        ]
      }
    ]
  }
}
```

**文件**：`~/.claude/hooks/auto-checkpoint.sh`（新建）

```bash
#!/bin/bash
# Auto-checkpoint: 每次文件变更后自动 git commit
# 安全设计：60s 防抖 + git add -u（仅已跟踪文件）+ --no-verify（避免 hook 死循环）

LOCK="$HOME/.claude/.checkpoint-ts"
NOW=$(date +%s)
LAST=$(cat "$LOCK" 2>/dev/null || echo 0)
# 防抖：距上次 checkpoint <60s 则跳过
if (( NOW - LAST < 60 )); then exit 0; fi

# 检测当前是否在 git 仓库中
if ! git rev-parse --is-inside-work-tree &>/dev/null; then exit 0; fi

# 只暂存已跟踪文件（避免意外提交 .env 等敏感文件）
git add -u
git diff --cached --quiet && exit 0

# checkpoint commit（--no-verify 仅用于 auto-checkpoint，避免 pre-commit hook 死循环）
git commit -m "auto: agent checkpoint $(date +%H:%M)" --no-verify
echo "$NOW" > "$LOCK"
```

### 1.4 DevBoard LogViewer 模块

**文件**：`D:\projects\devboard\src\components\AgentLogViewer.tsx`（新建）

**数据流**：
- `sync-data.sh` 复制最近 7 天的 `~/.claude/agent-logs/*.md` 到 `src/data/agent-logs/`
- 组件读取并解析 markdown 格式
- 展示日志条目列表 + 每日摘要卡片

**功能**：
- 日期标签切换（最近 7 天）
- pass/fail/warn 颜色编码
- 按项目/结果类型过滤
- 失败条目可展开查看详情

### Phase 1 涉及的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `~/.claude/CLAUDE.md` | 编辑 | 追加 Agent Log 规范 |
| `~/.claude/settings.json` | 编辑 | 添加 PostToolUse hook |
| `~/.claude/hooks/auto-checkpoint.sh` | 新建 | auto-checkpoint 脚本 |
| `devboard/src/components/AgentLogViewer.tsx` | 新建 | 日志查看器模块 |
| `devboard/src/hooks/useAgentLogs.ts` | 新建 | 日志数据 hook |
| `devboard/src/data/agent-logs/` | 新建目录 | 同步的日志文件 |
| `devboard/scripts/sync-data.sh` | 编辑 | 添加 agent-logs 同步 |
| `devboard/src/App.tsx` | 编辑 | 添加 AgentLogViewer 模块 |

---

## Phase 2：claude-cron 扩展

### 2.1 目录结构

```
D:\tools\claude-cron\
├── config.json               ← 新增：任务配置 + 错峰时间窗
├── orchestrator.bat           ← 新增：主调度器
├── run-task.bat               ← 新增：通用任务执行器
├── run-tsc-check.bat          ← 保留（向后兼容）
├── prompts/
│   ├── tsc-check.txt          ← 已有
│   ├── patrol.txt             ← 新增：全项目代码巡检
│   ├── batch-fix.txt          ← 新增：批量修改模板
│   ├── data-sync.txt          ← 新增：数据同步 + 报告
│   └── pr-review.txt          ← 新增：PR Review + 文档
└── logs/
    ├── run.log                ← 执行输出
    └── orchestrator.log       ← 调度器日志
```

### 2.2 config.json

```json
{
  "offPeakWindow": { "start": "01:00", "end": "07:00" },
  "defaultModel": "sonnet",
  "projects": [
    { "name": "ai_projects", "path": "D:/projects/cybernium/ai_projects" },
    { "name": "pixel-herbarium", "path": "D:/projects/Games/gardern/pixel-herbarium" },
    { "name": "scrapling-mcp", "path": "D:/projects/scrapling-mcp" },
    { "name": "Data_management", "path": "D:/projects/Data_management" },
    { "name": "ziyou-server", "path": "D:/projects/ziyou/ziyou-server" },
    { "name": "devboard", "path": "D:/projects/devboard" }
  ],
  "tasks": [
    {
      "name": "patrol",
      "prompt": "prompts/patrol.txt",
      "schedule": "0 2 * * *",
      "budgetUsd": 0.50,
      "maxTurns": 15,
      "projects": ["all"],
      "description": "全项目 TSC + 测试 + lint 巡检"
    },
    {
      "name": "data-sync",
      "prompt": "prompts/data-sync.txt",
      "schedule": "30 5 * * *",
      "budgetUsd": 0.20,
      "maxTurns": 8,
      "projects": ["devboard"],
      "description": "DevBoard 数据同步 + 日报生成"
    },
    {
      "name": "pr-review",
      "prompt": "prompts/pr-review.txt",
      "schedule": "0 3 * * 1,3,5",
      "budgetUsd": 0.40,
      "maxTurns": 10,
      "projects": ["ai_projects", "scrapling-mcp"],
      "description": "开放 PR 自动 review（周一三五）"
    },
    {
      "name": "batch-fix",
      "prompt": "prompts/batch-fix.txt",
      "schedule": "manual",
      "budgetUsd": 1.00,
      "maxTurns": 20,
      "projects": ["all"],
      "description": "手动触发的批量代码修改"
    }
  ]
}
```

### 2.3 Prompt 模板

**patrol.txt**：
```
对以下项目执行代码质量巡检：
$PROJECTS

每个项目执行：
1. `pnpm tsc --noEmit` 或 `npx tsc --noEmit`
2. 运行测试套件（pnpm test / pytest）
3. git status 检查未提交更改

结果写入：
- ~/.claude/agent-logs/$(date +%Y-%m-%d).md 格式：[HH:MM] patrol:$TASK | result | detail
- ~/.claude/data/cron-log.jsonl 格式：{"date":"...","time":"...","taskName":"patrol:tsc-check","taskType":"patrol","project":"...","result":"...","detail":"...","durationSec":N,"source":"cron","isOffPeak":true/false}

发现 fail 时在 detail 中包含具体错误文件和行号。
巡检完成后运行 bash D:/projects/devboard/scripts/sync-data.sh 同步数据。
```

**data-sync.txt**：
```
执行 DevBoard 数据同步和每日报告：
1. 运行 bash D:/projects/devboard/scripts/sync-data.sh
2. 读取 ~/.claude/agent-logs/ 中今天的日志
3. 在今天的 agent-logs 文件末尾生成每日摘要（如果没有的话）
4. cd D:/projects/devboard && git add src/data/ && git diff --cached --quiet || git commit -m "data: auto-sync $(date +%Y-%m-%d)" && git push

结果记录到 agent-logs 和 cron-log.jsonl（source: "cron"）。
```

**pr-review.txt**：
```
检查以下项目的开放 PR：
$PROJECTS

对每个项目（cd 到项目目录）：
1. /c/Users/Admin/gh-cli/bin/gh pr list --state open --json number,title,author,updatedAt
2. 对每个 PR：/c/Users/Admin/gh-cli/bin/gh pr diff <number>
3. 审查代码：关注安全、性能、类型安全、测试覆盖
4. 以 comment 形式添加 review：/c/Users/Admin/gh-cli/bin/gh pr comment <number> --body "..."

注意：仅添加 review comment，绝不自动 merge 或 approve。
结果记录到 agent-logs 和 cron-log.jsonl（source: "cron"）。
```

**batch-fix.txt**：
```
对以下项目执行批量代码修改：
$PROJECTS

任务描述：$TASK_DESCRIPTION

执行步骤：
1. 在每个项目中搜索需要修改的文件
2. 创建新分支：fix/batch-$(date +%Y%m%d)
3. 执行修改
4. 运行 tsc --noEmit 确认无类型错误
5. 运行测试确认无回归
6. git commit 修改（使用 conventional commit 格式）
7. 将分支推送到远端

注意：不直接在 main/master/dev 上修改，始终创建新分支。
结果记录到 agent-logs 和 cron-log.jsonl（source: "cron"）。
```

### 2.4 orchestrator.bat

**调度策略改动**：不再用单一 orchestrator 执行所有任务。改为 **每个任务注册独立的 Windows Task Scheduler 触发器**，由 `schedule-setup.ps1` 统一注册。orchestrator.bat 仅作为手动"全量执行"入口。

```batch
@echo off
REM DevBoard Agent Orchestrator — 手动全量执行入口
REM 正常情况下各任务由 Windows Task Scheduler 独立触发
REM 本脚本仅用于手动测试或一次性全量执行

set CRON_DIR=D:\tools\claude-cron
set LOG=%CRON_DIR%\logs\orchestrator.log

echo [%date% %time%] === Orchestrator (manual) started === >> "%LOG%"

REM 使用 node 解析 config，生成任务列表 + 项目列表 + 权限
node "%CRON_DIR%\resolve-tasks.js" > "%CRON_DIR%\logs\task-list.tmp"

for /f "tokens=1-6 delims=|" %%A in (%CRON_DIR%\logs\task-list.tmp) do (
    echo [%date% %time%] Running task: %%A >> "%LOG%"
    call "%CRON_DIR%\run-task.bat" %%A %%B %%C %%D %%E %%F
    echo [%date% %time%] Task %%A completed with exit code %ERRORLEVEL% >> "%LOG%"
    timeout /t 300 /nobreak > nul
)

echo [%date% %time%] === Orchestrator finished === >> "%LOG%"
```

### 2.4.1 resolve-tasks.js（新增）

解析 config.json，处理变量替换和权限分配：

```javascript
// resolve-tasks.js — 解析 config.json，输出任务执行参数
const fs = require('fs');
const path = require('path');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

const now = new Date();
const hour = now.getHours();
const start = parseInt(cfg.offPeakWindow.start);
const end = parseInt(cfg.offPeakWindow.end);
const isOffPeak = hour >= start && hour < end;

// 每个任务类型的最小权限
const TASK_TOOLS = {
  patrol:      'Bash,Read,Grep,Glob',           // 只读巡检
  'data-sync': 'Bash,Read,Write,Grep,Glob',     // 需要写 data 文件
  'pr-review': 'Bash,Read,Grep,Glob',           // 只读 + gh CLI
  'batch-fix': 'Bash,Read,Write,Edit,Grep,Glob', // 完整写权限
};

const tasks = cfg.tasks.filter(t => t.schedule !== 'manual');
tasks.forEach(t => {
  // 解析项目列表
  const projects = t.projects[0] === 'all'
    ? cfg.projects.map(p => p.path).join(',')
    : t.projects.map(name => cfg.projects.find(p => p.name === name)?.path).filter(Boolean).join(',');
  const tools = TASK_TOOLS[t.name] || 'Bash,Read,Grep,Glob';
  // 输出格式：name|promptFile|budget|maxTurns|isOffPeak|tools|projects
  console.log(`${t.name}|${t.prompt}|${t.budgetUsd}|${t.maxTurns}|${isOffPeak}|${tools}`);
});
```

### 2.5 run-task.bat

```batch
@echo off
REM 通用任务执行器
REM 参数：%1=taskName %2=promptFile %3=budgetUsd %4=maxTurns %5=isOffPeak %6=allowedTools

set TASK_NAME=%1
set PROMPT_FILE=%2
set BUDGET=%3
set MAX_TURNS=%4
set IS_OFF_PEAK=%5
set ALLOWED_TOOLS=%6

set CRON_DIR=D:\tools\claude-cron
set LOG=%CRON_DIR%\logs\run.log
set CLAUDE_CMD=C:\Users\Admin\AppData\Roaming\npm\claude.cmd

REM 清除可能继承的环境变量
set CLAUDECODE=

REM 设置 PATH
set PATH=C:\Program Files\Git\bin;C:\Program Files\nodejs;C:\Users\Admin\AppData\Roaming\npm;%PATH%

echo [%date% %time%] === Task: %TASK_NAME% (budget: $%BUDGET%, turns: %MAX_TURNS%, tools: %ALLOWED_TOOLS%) === >> "%LOG%"

REM 变量替换：生成最终 prompt
node -e "const fs=require('fs');const cfg=JSON.parse(fs.readFileSync('D:/tools/claude-cron/config.json','utf8'));const t=cfg.tasks.find(x=>x.name==='%TASK_NAME%');const projects=(!t||t.projects[0]==='all')?cfg.projects.map(p=>p.path).join('\n'):t.projects.map(n=>cfg.projects.find(p=>p.name===n)).filter(Boolean).map(p=>p.path).join('\n');let prompt=fs.readFileSync('D:/tools/claude-cron/%PROMPT_FILE%','utf8');prompt=prompt.replace(/\$PROJECTS/g,projects);process.stdout.write(prompt)" > "%CRON_DIR%\logs\prompt-resolved.tmp"

REM 调用 claude（使用完整路径 + 最小权限工具集）
"%CLAUDE_CMD%" --allowedTools "%ALLOWED_TOOLS%" ^
    --permission-mode dontAsk ^
    --max-turns %MAX_TURNS% ^
    --max-budget-usd %BUDGET% ^
    -p < "%CRON_DIR%\logs\prompt-resolved.tmp" >> "%LOG%" 2>&1

set EXIT_CODE=%ERRORLEVEL%

REM 崩溃保底：如果 Claude 非 0 退出且未写 JSONL，补一条 crash 记录
if not "%EXIT_CODE%"=="0" (
    node -e "const fs=require('fs');const d=new Date();const entry={date:d.toISOString().slice(0,10),time:d.toTimeString().slice(0,5),taskName:'%TASK_NAME%',taskType:'%TASK_NAME%',project:'unknown',result:'crash',detail:'claude.cmd exited with code %EXIT_CODE%',durationSec:0,source:'cron',isOffPeak:%IS_OFF_PEAK%};fs.appendFileSync(process.env.HOME+'/.claude/data/cron-log.jsonl',JSON.stringify(entry)+'\n')"
)

echo [%date% %time%] Exit code: %EXIT_CODE% >> "%LOG%"
```

### 2.6 Windows Task Scheduler

**策略**：每个任务注册为独立的 Scheduled Task，由 `schedule-setup.ps1` 统一注册。

用 `schedule-setup.ps1` 注册以下任务：

| Task Scheduler 任务名 | 触发器 | 操作 |
|----------------------|--------|------|
| Claude-Patrol | 每日 02:00 | `run-task.bat patrol ...` |
| Claude-DataSync | 每日 05:30 | `run-task.bat data-sync ...` |
| Claude-PRReview | 周一三五 03:00 | `run-task.bat pr-review ...` |

- **条件**：仅在交流电源下运行（防止笔记本睡眠中断）
- `orchestrator.bat` 保留作为手动全量执行入口（不注册到 Task Scheduler）

### Phase 2 涉及的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `claude-cron/config.json` | 新建 | 任务配置 + 错峰窗口 |
| `claude-cron/resolve-tasks.js` | 新建 | 解析 config + 变量替换 + 权限分配 |
| `claude-cron/orchestrator.bat` | 新建 | 手动全量执行入口 |
| `claude-cron/run-task.bat` | 新建 | 通用任务执行器（含变量替换 + 崩溃保底） |
| `claude-cron/prompts/patrol.txt` | 新建 | 代码巡检 prompt |
| `claude-cron/prompts/batch-fix.txt` | 新建 | 批量修改 prompt |
| `claude-cron/prompts/data-sync.txt` | 新建 | 数据同步 prompt |
| `claude-cron/prompts/pr-review.txt` | 新建 | PR Review prompt |
| `claude-cron/schedule-setup.ps1` | 新建 | 注册独立任务到 Task Scheduler |

---

## Phase 3：DevBoard 升级

### 3.1 数据层增强

**文件**：`devboard/src/types.ts`

扩展 CronLogEntry：
```typescript
interface CronLogEntry {
  date: string;
  time: string;
  taskName: string;
  taskType: CronTaskType;
  project: string;
  result: CronResult;
  detail: string;
  durationSec: number;
  source: 'session' | 'cron' | 'loop';  // 新增
  isOffPeak: boolean;                     // 新增
}

// 扩展类型
type CronTaskType = 'dev' | 'monitor' | 'grind' | 'patrol' | 'batch-fix' | 'data-sync' | 'pr-review' | 'manual' | 'verify';
```

**向后兼容**：现有数据无 source/isOffPeak 字段，代码中设默认值：
```typescript
source: entry.source ?? 'session',
isOffPeak: entry.isOffPeak ?? false
```

### 3.2 AgentTimeline 模块（新增）

**文件**：`devboard/src/components/AgentTimeline.tsx`

**设计要点**：
- 基于 Recharts ScatterChart
- 横轴：24 小时（0-23），纵轴：最近 7 天日期
- 错峰窗口（01:00-07:00）蓝色背景 ReferenceArea
- 每个活动点：颜色 = result（green/red/yellow/gray），大小 = durationSec
- Tooltip 显示完整信息
- 底部统计栏：错峰执行占比、总任务数、通过率

**数据源**：复用 `useCronData` hook（cron-log.json）

### 3.3 AgentLogViewer 模块（Phase 1 已定义）

**文件**：`devboard/src/components/AgentLogViewer.tsx`

**新增 hook**：`devboard/src/hooks/useAgentLogs.ts`
- 读取 `src/data/agent-logs/*.md`
- 解析 markdown 为结构化数据

### 3.4 OffPeakMetrics 模块（新增）

**文件**：`devboard/src/components/OffPeakMetrics.tsx`

**设计要点**：
- 利用率环形图：Recharts PieChart，错峰 vs 非错峰任务比例
- Token 节省估算卡片（错峰任务数 × 2x 系数）
- 7 天错峰趋势折线图
- 优化建议（如果大量任务在非错峰执行）

**数据源**：复用 `useCronData`，按 isOffPeak 字段聚合

### 3.5 CronDashboard 增强

**文件**：`devboard/src/components/CronDashboard.tsx`（编辑）

**新增功能**：
- 来源标签（session badge / cron badge / loop badge）
- 错峰标记（🌙 图标）
- 7 天 pass/fail 趋势小折线图
- Autopilot 模式卡片增加 patrol 模式

### 3.6 sync-data.sh 增强

**文件**：`devboard/scripts/sync-data.sh`（编辑）

新增逻辑：
```bash
# 同步 agent-logs（最近 7 天）
AGENT_LOGS_SRC="$HOME/.claude/agent-logs"
AGENT_LOGS_DST="src/data/agent-logs"
mkdir -p "$AGENT_LOGS_DST"
# 清理旧文件
rm -f "$AGENT_LOGS_DST"/*.md
# 复制最近 7 天
find "$AGENT_LOGS_SRC" -name "*.md" -mtime -7 -exec cp {} "$AGENT_LOGS_DST/" \; 2>/dev/null
```

### 3.7 App.tsx 更新

**文件**：`devboard/src/App.tsx`（编辑）

模块列表从 7 扩展到 10：
```
1. PortfolioGrid（不变）
2. TokenAnalytics（不变）
3. SessionLog（不变）
4. Timeline（不变）
5. ProjectTasks（不变）
6. RoadmapGantt（不变）
7. CronDashboard（增强）
8. AgentTimeline（新增 - 24h 活动视图）
9. AgentLogViewer（新增 - 日志查看器）
10. OffPeakMetrics（新增 - 错峰利用率）
```

### Phase 3 涉及的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `devboard/src/types.ts` | 编辑 | 扩展 CronLogEntry + CronTaskType |
| `devboard/src/components/AgentTimeline.tsx` | 新建 | 24h 活动视图 |
| `devboard/src/components/AgentLogViewer.tsx` | 新建 | 日志查看器 |
| `devboard/src/components/OffPeakMetrics.tsx` | 新建 | 错峰利用率 |
| `devboard/src/components/CronDashboard.tsx` | 编辑 | 增加来源/错峰/趋势 |
| `devboard/src/hooks/useAgentLogs.ts` | 新建 | 日志数据 hook |
| `devboard/scripts/sync-data.sh` | 编辑 | 添加 agent-logs 同步 |
| `devboard/src/App.tsx` | 编辑 | 添加 3 个新模块 |
| `devboard/src/theme.ts` | 编辑 | 添加 source/offpeak 颜色 |

---

## 全局架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                    夜间（01:00-07:00 错峰双倍）                    │
│                                                                  │
│  Windows Task Scheduler                                          │
│       ↓ 01:00 触发                                               │
│  orchestrator.bat                                                │
│       ↓ 遍历 config.json                                         │
│  run-task.bat × N                                                │
│       ↓ 每个任务调用 claude.cmd                                    │
│  Claude CLI (headless, --permission-mode dontAsk)                │
│       ↓ 执行 prompt 模板                                         │
│       ├→ agent-logs/YYYY-MM-DD.md     (人类可读)                 │
│       ├→ cron-log.jsonl               (DevBoard 数据源)          │
│       └→ git auto-checkpoint          (PostToolUse hook)        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    白天（开发时段）                                │
│                                                                  │
│  /autopilot dev|monitor|grind                                    │
│       ↓ CronCreate                                               │
│  /loop 任务                                                      │
│       ↓ 执行                                                     │
│       ├→ agent-logs/YYYY-MM-DD.md                                │
│       ├→ cron-log.jsonl                                          │
│       └→ git auto-checkpoint                                    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    DevBoard 可视化层                               │
│                                                                  │
│  sync-data.sh                                                    │
│       ↓ 同步 JSONL + agent-logs                                  │
│  src/data/ (JSON + .md files)                                    │
│       ↓                                                          │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐      │
│  │AgentTimeline│AgentLogView │OffPeakMetric│CronDashboard │      │
│  │  24h 视图   │  日志查看   │  错峰利用率  │  增强版       │      │
│  └─────────────┴─────────────┴─────────────┴──────────────┘      │
│       ↓ git push                                                 │
│  Vercel auto-deploy → devboard-jade.vercel.app                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 验证方案

### Phase 1 验证
1. **日志写入**：手动执行 `/loop 1m echo test`，确认 `~/.claude/agent-logs/YYYY-MM-DD.md` 被创建且格式正确
2. **Auto-checkpoint**：编辑任意项目文件，等待 60s，确认 `git log --oneline -1` 显示 `auto: agent checkpoint HH:MM`
3. **DevBoard LogViewer**：运行 `npm run sync` + `npm run dev`，确认 LogViewer 模块正确展示日志
4. **构建验证**：`cd D:\projects\devboard && npm run build` 通过

### Phase 2 验证
1. **config 解析**：`node -e "console.log(JSON.parse(require('fs').readFileSync('config.json','utf8')))"` 无报错
2. **单任务执行**：`run-task.bat patrol prompts/patrol.txt 0.10 3 true` 手动测试，确认 agent-logs 和 cron-log.jsonl 有新记录
3. **调度器**：手动运行 `orchestrator.bat`，确认按序执行并记录到 orchestrator.log
4. **Task Scheduler**：PowerShell `Get-ScheduledTask -TaskName "Claude-Agent-Orchestrator"` 确认注册成功

### Phase 3 验证
1. **类型检查**：`cd D:\projects\devboard && npx tsc --noEmit` 无错误
2. **构建**：`npm run build` 通过
3. **视觉验证**：`npm run dev` 后检查每个新模块渲染正常
4. **数据流**：确认 sync 后 cron-log.json 包含 source/isOffPeak 字段

---

## 实施顺序

### Phase 1（预计 1 session）
1. `mkdir -p ~/.claude/agent-logs/ ~/.claude/hooks/`
2. 创建 `~/.claude/hooks/auto-checkpoint.sh`
3. 编辑 `~/.claude/settings.json` 添加 PostToolUse hook
4. 编辑 `~/.claude/CLAUDE.md` 追加日志规范
5. 创建 `devboard/src/hooks/useAgentLogs.ts`
6. 创建 `devboard/src/components/AgentLogViewer.tsx`
7. 编辑 `devboard/scripts/sync-data.sh` 添加 agent-logs 同步
8. 编辑 `devboard/src/App.tsx` 添加 LogViewer
9. 验证：`npm run build` 通过 + 手动测试日志写入

### Phase 2（预计 1 session）
1. 创建 `claude-cron/config.json`
2. 创建 `claude-cron/resolve-tasks.js`
3. 创建 4 个 prompt 模板（含 $PROJECTS 占位符）
4. 创建 `claude-cron/run-task.bat`（含变量替换 + 崩溃保底 + 完整 claude.cmd 路径）
5. 创建 `claude-cron/orchestrator.bat`（手动全量入口）
6. 创建 `claude-cron/schedule-setup.ps1`（每任务独立注册）
7. 验证：手动执行单任务 + PowerShell 确认 Scheduled Task 注册

### Phase 3（预计 1-2 sessions）
1. 编辑 `devboard/src/types.ts` 扩展 CronTaskType + CronLogEntry
2. 创建 `AgentTimeline.tsx`
3. 创建 `OffPeakMetrics.tsx`
4. 增强 `CronDashboard.tsx`（更新 typeFilters 添加 patrol/data-sync/pr-review/batch-fix）
5. 编辑 `App.tsx`（新模块放在 CronDashboard 之后）+ `theme.ts`
6. 验证：`npm run build` + 视觉检查

---

## 附录：Spec Review 修复记录

### 已修复的 Critical/High 问题

| # | 严重度 | 问题 | 修复方案 |
|---|--------|------|---------|
| 3.1 | Critical | orchestrator 忽略 cron schedule，所有任务一起跑 | 改为每任务独立 Task Scheduler 触发器，orchestrator 仅作手动入口 |
| 3.4 | Critical | $PROJECTS 占位符无替换机制 | 新增 resolve-tasks.js + run-task.bat 中 node 变量替换 |
| 1.1 | High | PostToolUse hook schema 不正确 | 改为正确的 `{ matcher, hooks: [{ type, command }] }` 结构 |
| 5.2 | High | 所有任务统一使用 Write/Edit 权限 | resolve-tasks.js 中按任务类型分配最小权限工具集 |

### 同时修复的 Medium 问题

| # | 问题 | 修复方案 |
|---|------|---------|
| 3.2 | run-task.bat 缺少 `set CLAUDECODE=` | 已添加 |
| 3.3 | claude.cmd 未使用完整路径 | 改为 `C:\Users\Admin\AppData\Roaming\npm\claude.cmd` |
| 6.2 | 缺少 `mkdir -p ~/.claude/hooks/` | 实施步骤 1 中合并创建 |
| 6.3 | 任务崩溃无保底记录 | run-task.bat 添加非 0 退出时写 crash JSONL |
| 2.2 | CronDashboard filter chips 不含新任务类型 | Phase 3 步骤 4 明确更新 typeFilters |

### 已知限制（可接受）

- **Auto-checkpoint 使用 `--no-verify`**：仅影响 checkpoint commit，人工 /commit 不受影响
- **Mid-refactor checkpoint**：60s 防抖可能在多文件重构中产生中间态 commit，但优于完全丢失
- **Agent 日志可靠性**：Claude 写日志依赖指令遵从，无强制验证层；崩溃保底可兜底极端情况

### useAgentLogs Hook 规格

```typescript
// devboard/src/hooks/useAgentLogs.ts

interface AgentLogEntry {
  time: string;        // "02:30"
  taskName: string;    // "patrol:tsc-check"
  result: 'pass' | 'fail' | 'warn' | 'info';
  detail: string;      // "ai_projects: 0 errors"
}

interface DailySummary {
  total: number;
  pass: number;
  fail: number;
  warn: number;
  offPeakCount: number;
  daytimeCount: number;
  keyIssues: string[];
}

interface AgentLogDay {
  date: string;         // "2026-03-16"
  entries: AgentLogEntry[];
  summary: DailySummary | null;
}

function useAgentLogs(): {
  days: AgentLogDay[];
  loading: boolean;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  filteredEntries: AgentLogEntry[];
  filterByProject: string | null;
  setFilterByProject: (project: string | null) => void;
  filterByResult: string | null;
  setFilterByResult: (result: string | null) => void;
}

// 解析逻辑：
// 1. import.meta.glob('./data/agent-logs/*.md', { as: 'raw' })
// 2. 正则解析每行：/^\[(\d{2}:\d{2})\]\s+(.+?)\s+\|\s+(pass|fail|warn|info)\s+\|\s+(.+)$/
// 3. 摘要部分正则：/^- 总执行:\s+(\d+)/
```

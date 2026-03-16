#!/bin/bash
# Sync data from ~/.claude/data/ to devboard/public/data/
set -e
cd "$(dirname "$0")/.."

DATA_DIR="$HOME/.claude/data"

echo "Syncing DevBoard data..."

# Copy latest portfolio snapshot
if [ -f "$DATA_DIR/portfolio-data.json" ]; then
  cp "$DATA_DIR/portfolio-data.json" public/data/
  echo "  done: portfolio-data.json"
else
  echo "  skip: portfolio-data.json (not found)"
fi

# Sync agent-logs (last 7 days)
AGENT_LOGS_SRC="$HOME/.claude/agent-logs"
AGENT_LOGS_DST="public/data/agent-logs"
mkdir -p "$AGENT_LOGS_DST"
rm -f "$AGENT_LOGS_DST"/*.md
if [ -d "$AGENT_LOGS_SRC" ]; then
  find "$AGENT_LOGS_SRC" -name "*.md" -mtime -7 -exec cp {} "$AGENT_LOGS_DST/" \; 2>/dev/null
  COUNT=$(ls -1 "$AGENT_LOGS_DST"/*.md 2>/dev/null | wc -l)
  echo "  done: agent-logs ($COUNT files)"
else
  echo "  skip: agent-logs (source dir not found)"
fi

# Generate agent-logs index.json for runtime fetch
if ls "$AGENT_LOGS_DST"/*.md 1>/dev/null 2>&1; then
  (cd "$AGENT_LOGS_DST" && ls -1r *.md | node -e "
    let buf=''; process.stdin.on('data',c=>buf+=c); process.stdin.on('end',()=>{
      const lines=buf.trim().split('\n'); process.stdout.write(JSON.stringify(lines,null,2)+'\n');
    });
  " > index.json)
  echo "  done: agent-logs/index.json"
fi

# Copy health-status from claude-cron
HEALTH_SRC="D:/tools/claude-cron/logs/health-status.json"
if [ -f "$HEALTH_SRC" ]; then
  cp "$HEALTH_SRC" public/data/
  echo "  done: health-status.json"
else
  echo "  skip: health-status.json (not found)"
fi

# Copy cron config (task registry + workflows)
CRON_CONFIG="D:/tools/claude-cron/config.json"
if [ -f "$CRON_CONFIG" ]; then
  cp "$CRON_CONFIG" public/data/cron-config.json
  echo "  done: cron-config.json"
else
  echo "  skip: cron-config.json (not found)"
fi

# Rotate old logs before converting
ROTATE_SCRIPT="D:/tools/claude-cron/rotate-logs.sh"
if [ -f "$ROTATE_SCRIPT" ]; then
  bash "$ROTATE_SCRIPT"
fi

# Convert JSONL files to JSON arrays
node scripts/convert-jsonl.js

echo "Sync complete."

# Auto-commit & push if data changed
if git diff --quiet public/data/; then
  echo "No data changes, skipping commit."
else
  DATE=$(date +%Y-%m-%d)
  git add public/data/
  git commit -m "data: sync ${DATE}"
  git push origin master
  echo "Pushed data update to GitHub → Vercel will auto-deploy."
fi

# Write timestamped log entry
mkdir -p logs
echo "[$(date '+%Y-%m-%d %H:%M:%S')] sync done" >> logs/sync.log
# Keep only last 7 days of log lines
if [ -f logs/sync.log ]; then
  tail -n 500 logs/sync.log > logs/sync.tmp && mv logs/sync.tmp logs/sync.log
fi

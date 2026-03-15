#!/bin/bash
# Sync data from ~/.claude/data/ to devboard/src/data/
set -e
cd "$(dirname "$0")/.."

DATA_DIR="$HOME/.claude/data"

echo "Syncing DevBoard data..."

# Copy latest portfolio snapshot
if [ -f "$DATA_DIR/portfolio-data.json" ]; then
  cp "$DATA_DIR/portfolio-data.json" src/data/
  echo "  done: portfolio-data.json"
else
  echo "  skip: portfolio-data.json (not found)"
fi

# Sync agent-logs (last 7 days)
AGENT_LOGS_SRC="$HOME/.claude/agent-logs"
AGENT_LOGS_DST="src/data/agent-logs"
mkdir -p "$AGENT_LOGS_DST"
rm -f "$AGENT_LOGS_DST"/*.md
if [ -d "$AGENT_LOGS_SRC" ]; then
  find "$AGENT_LOGS_SRC" -name "*.md" -mtime -7 -exec cp {} "$AGENT_LOGS_DST/" \; 2>/dev/null
  COUNT=$(ls -1 "$AGENT_LOGS_DST"/*.md 2>/dev/null | wc -l)
  echo "  done: agent-logs ($COUNT files)"
else
  echo "  skip: agent-logs (source dir not found)"
fi

# Convert JSONL files to JSON arrays
node scripts/convert-jsonl.js

echo "Sync complete."

# Auto-commit & push if data changed
if git diff --quiet src/data/; then
  echo "No data changes, skipping commit."
else
  DATE=$(date +%Y-%m-%d)
  git add src/data/
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

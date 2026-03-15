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

# Convert JSONL files to JSON arrays
node scripts/convert-jsonl.js

echo "Sync complete. Run 'npm run build' to rebuild."

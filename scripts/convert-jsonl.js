import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const dataDir = join(homedir(), '.claude', 'data');
const outDir = join(import.meta.dirname, '..', 'public', 'data');

const files = [
  { input: 'portfolio-history.jsonl', output: 'portfolio-history.json' },
  { input: 'sessions-log.jsonl', output: 'sessions-log.json' },
  { input: 'token-daily.jsonl', output: 'token-daily.json' },
  { input: 'cron-log.jsonl', output: 'cron-log.json' },
  { input: 'usage-log.jsonl', output: 'usage-log.json' },
];

for (const { input, output } of files) {
  const inputPath = join(dataDir, input);
  const outputPath = join(outDir, output);

  if (!existsSync(inputPath)) {
    console.log(`  skip: ${input} (not found)`);
    continue;
  }

  const rawLines = readFileSync(inputPath, 'utf-8')
    .split('\n')
    .filter((l) => l.trim());
  let lines = [];
  for (const l of rawLines) {
    try {
      lines.push(JSON.parse(l));
    } catch (e) {
      console.warn(`  warn: skipped malformed line in ${input}: ${l.slice(0, 80)}`);
    }
  }

  // Merge same-date token-daily entries (byModel + byProject accumulated)
  if (input === 'token-daily.jsonl') {
    const merged = {};
    for (const entry of lines) {
      if (!merged[entry.date]) {
        merged[entry.date] = { ...entry, byModel: { ...entry.byModel }, byProject: { ...entry.byProject } };
      } else {
        const m = merged[entry.date];
        m.totalTokens += entry.totalTokens;
        m.sessionCount += entry.sessionCount;
        for (const [k, v] of Object.entries(entry.byModel)) m.byModel[k] = (m.byModel[k] || 0) + v;
        for (const [k, v] of Object.entries(entry.byProject)) m.byProject[k] = (m.byProject[k] || 0) + v;
      }
    }
    lines = Object.values(merged).sort((a, b) => a.date.localeCompare(b.date));
  }

  writeFileSync(outputPath, JSON.stringify(lines, null, 2) + '\n');
  console.log(`  done: ${input} → ${output} (${lines.length} entries)`);
}

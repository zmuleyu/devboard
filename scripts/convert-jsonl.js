import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const dataDir = join(homedir(), '.claude', 'data');
const outDir = join(import.meta.dirname, '..', 'src', 'data');

const files = [
  { input: 'portfolio-history.jsonl', output: 'portfolio-history.json' },
  { input: 'sessions-log.jsonl', output: 'sessions-log.json' },
  { input: 'token-daily.jsonl', output: 'token-daily.json' },
];

for (const { input, output } of files) {
  const inputPath = join(dataDir, input);
  const outputPath = join(outDir, output);

  if (!existsSync(inputPath)) {
    console.log(`  skip: ${input} (not found)`);
    continue;
  }

  const lines = readFileSync(inputPath, 'utf-8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

  writeFileSync(outputPath, JSON.stringify(lines, null, 2) + '\n');
  console.log(`  done: ${input} → ${output} (${lines.length} entries)`);
}

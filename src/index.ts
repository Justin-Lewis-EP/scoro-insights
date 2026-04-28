import { fetchWeeklyTasks, getWeekRange } from './tasks';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const { from, to, monday } = getWeekRange();
  console.log(`Fetching tasks created ${from} → ${to}...\n`);

  const enriched = await fetchWeeklyTasks();

  console.log(`Tasks created this week: ${enriched.length}\n`);

  const headers = Object.keys(enriched[0] ?? {}) as (keyof typeof enriched[0])[];
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...enriched.map(row => headers.map(h => escape(row[h])).join(',')),
  ].join('\n');

  const outPath = join(process.cwd(), `tasks-created-week-${monday}.csv`);
  writeFileSync(outPath, csv, 'utf-8');
  console.log(`Exported to ${outPath}`);
}

main().catch(console.error);

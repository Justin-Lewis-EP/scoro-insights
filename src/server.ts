import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { fetchWeeklyTasks, EnrichedTask } from './tasks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

interface CacheEntry {
  data: EnrichedTask[];
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 45 * 60 * 1000;

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/api/tasks/weekly', async (req: Request, res: Response) => {
  const weekParam = req.query.week as string | undefined;

  if (weekParam && !/^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    return res.status(400).json({ error: 'week must be YYYY-MM-DD' });
  }

  const key = weekParam ?? 'current';
  const cached = cache.get(key);

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const tasks = await fetchWeeklyTasks(weekParam ? new Date(weekParam) : undefined);
    cache.set(key, { data: tasks, fetchedAt: Date.now() });
    return res.json(tasks);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: msg });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

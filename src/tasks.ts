import { ScoroClient } from './scoro-client';

export interface Task {
  event_id: number;
  event_name: string;
  created_date: string;
  owner_id: number;
  owner_email: string;
  project_id: number;
  status: string;
  datetime_due: string;
  [key: string]: unknown;
}

export interface Contact {
  contact_id: number;
  name: string;
  lastname: string;
  contact_type: string;
  [key: string]: unknown;
}

export interface Project {
  project_id: number;
  project_name: string;
  [key: string]: unknown;
}

export interface EnrichedTask {
  task_id: number;
  task_name: string;
  created_date: string;
  created_date_formatted: string;
  creator_name: string;
  project_name: string;
  status: string;
  deadline: string;
}

export interface WeekRange {
  from: string;
  to: string;
  monday: string;
}

export async function fetchAll<T>(
  client: ScoroClient,
  module: string,
  filter?: Record<string, unknown>
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  while (true) {
    const res = await client.list<T[]>(module, { page, perPage: 50, filter });
    const items = res.data ?? [];
    results.push(...items);
    if (items.length < 50) break;
    page++;
  }
  return results;
}

export function getWeekRange(anchorDate?: Date): WeekRange {
  const now = anchorDate ?? new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(sunday), monday: fmt(monday) };
}

export async function fetchWeeklyTasks(weekDate?: Date): Promise<EnrichedTask[]> {
  const client = new ScoroClient();
  const { from, to } = getWeekRange(weekDate);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const [tasks, contacts, projects] = await Promise.all([
    fetchAll<Task>(client, 'tasks', {
      created_date: { from_date: from, to_date: to },
    }),
    fetchAll<Contact>(client, 'contacts'),
    fetchAll<Project>(client, 'projects'),
  ]);

  const userMap = new Map<number, string>(
    contacts.map(c => [c.contact_id, c.lastname ? `${c.name} ${c.lastname}`.trim() : c.name])
  );
  const projectMap = new Map<number, string>(
    projects.map(p => [p.project_id, p.project_name])
  );

  return tasks.map(t => ({
    task_id: t.event_id,
    task_name: t.event_name,
    created_date: t.created_date,
    created_date_formatted: fmtDate(t.created_date),
    creator_name: userMap.get(t.owner_id) ?? t.owner_email ?? `(user ${t.owner_id})`,
    project_name: t.project_id ? (projectMap.get(t.project_id) ?? `(project ${t.project_id})`) : '—',
    status: t.status,
    deadline: t.datetime_due || '—',
  }));
}

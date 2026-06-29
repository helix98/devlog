import { DevlogEntry } from './types';

export function formatTodayList(entries: DevlogEntry[]): string {
  if (entries.length === 0) return '';
  return entries
    .map((e) => {
      const time = e.timestamp.slice(11, 16);
      return `${time}  [${e.tag}] ${e.message}`;
    })
    .join('\n') + '\n';
}

export function formatList(entries: DevlogEntry[]): string {
  if (entries.length === 0) return '';
  return entries
    .map((e) => {
      const date = e.timestamp.slice(0, 10);
      const time = e.timestamp.slice(11, 16);
      return `${date} ${time}  [${e.tag}] ${e.message}`;
    })
    .join('\n') + '\n';
}

export function formatWeekMarkdown(entries: DevlogEntry[]): string {
  if (entries.length === 0) return '';

  const groups = new Map<string, DevlogEntry[]>();
  for (const e of entries) {
    const date = e.timestamp.slice(0, 10);
    const group = groups.get(date) || [];
    group.push(e);
    groups.set(date, group);
  }

  const sortedDates = [...groups.keys()].sort();

  const lines: string[] = [];
  const firstDate = new Date(sortedDates[0]);
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  const dateOpts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  const title = `# Devlog: ${firstDate.toLocaleDateString('en-US', dateOpts)} – ${lastDate.toLocaleDateString('en-US', dateOpts)}, ${lastDate.getFullYear()}`;
  lines.push(title);
  lines.push('');

  for (const date of sortedDates) {
    const d = new Date(date);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    lines.push(`## ${dayName}, ${monthDay}`);
    const dayEntries = groups.get(date)!;
    dayEntries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    for (const e of dayEntries) {
      lines.push(`- ${e.message}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatJSON(entries: DevlogEntry[]): string {
  return JSON.stringify(entries);
}

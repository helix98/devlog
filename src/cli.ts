import { parseArgs } from 'node:util';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { detectRepoTag } from './git';
import { getEntries, prependEntry } from './storage';
import { formatTodayList, formatList, formatWeekMarkdown, formatJSON } from './formatter';
import { DevlogEntry } from './types';

function generateId(): string {
  return new Date().toISOString().replace(/:/g, '-').replace(/\.(\d{3})Z$/, '-$1');
}

export function main(args?: string[]): string {
  try {
    const { values, positionals } = parseArgs({
      args: args ?? process.argv.slice(2),
      options: {
        json: { type: 'boolean', short: 'j', default: false },
        limit: { type: 'string', short: 'l', default: '20' },
      },
      allowPositionals: true,
      strict: false,
    });

    const command = positionals[0];

    if (!command) {
      return 'Usage: devlog <command> [options]\n\nCommands:\n  add <message>  Log an entry\n  today          Show today\'s entries\n  list           Show recent entries\n  week           Generate weekly markdown summary';
    }

    switch (command) {
      case 'add': {
        const message = positionals.slice(1).join(' ');
        if (!message) {
          return 'Error: message is required\ndevlog add <message>';
        }
        const tag = detectRepoTag();
        const id = generateId();
        const entry: DevlogEntry = {
          id,
          timestamp: new Date().toISOString(),
          message,
          tag,
        };
        prependEntry(entry);
        return id;
      }

      case 'today': {
        const allEntries = getEntries();
        const today = new Date().toISOString().slice(0, 10);
        const todayEntries = allEntries.filter((e) => e.timestamp.slice(0, 10) === today);
        if (values.json) {
          return formatJSON(todayEntries);
        }
        return formatTodayList(todayEntries);
      }

      case 'list': {
        const allEntries = getEntries();
        const limit = parseInt(values.limit as string, 10) || 20;
        const limited = allEntries.slice(0, limit);
        if (values.json) {
          return formatJSON(limited);
        }
        return formatList(limited);
      }

      case 'week': {
        const allEntries = getEntries();
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const cutoff = sevenDaysAgo.toISOString();
        const weekEntries = allEntries.filter((e) => e.timestamp >= cutoff);
        weekEntries.reverse();
        return formatWeekMarkdown(weekEntries);
      }

      default:
        return `Unknown command: ${command}\n\nCommands:\n  add <message>  Log an entry\n  today          Show today's entries\n  list           Show recent entries\n  week           Generate weekly markdown summary`;
    }
  } catch (err) {
    const path = join(homedir(), '.devlog', 'entries.json');
    return `Error: Failed to read or write ${path}\n${err instanceof Error ? err.message : String(err)}`;
  }
}

// Auto-run when executed directly (not during tests)
if (!process.env.VITEST) {
  const output = main();
  if (output) console.log(output);
}

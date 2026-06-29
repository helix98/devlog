import { parseArgs } from 'node:util';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { detectRepoTag } from './git';
import { getEntries, prependEntry } from './storage';
import { formatTodayList, formatList, formatWeekMarkdown, formatJSON } from './formatter';
import { DevlogEntry } from './types';

const USAGE = 'Usage: devlog <command> [options]\n\nCommands:\n  add <message>  Log an entry\n  today          Show today\'s entries\n  yesterday      Show yesterday\'s entries\n  list           Show recent entries\n  week           Generate weekly markdown summary';

function generateId(date?: Date): string {
  return (date ?? new Date()).toISOString().replace(/:/g, '-').replace(/\.(\d{3})Z$/, '-$1');
}

export function main(args?: string[]): string {
  try {
    const { values, positionals } = parseArgs({
      args: args ?? process.argv.slice(2),
      options: {
        json: { type: 'boolean', short: 'j', default: false },
        limit: { type: 'string', short: 'l', default: '20' },
        tag: { type: 'string', short: 't' },
      },
      allowPositionals: true,
      strict: false,
    });

    const command = positionals[0];

    if (!command) {
      return USAGE;
    }

    switch (command) {
      case 'add': {
        const message = positionals.slice(1).join(' ');
        if (!message) {
          return 'Error: message is required\ndevlog add <message>';
        }
        const tag = (values.tag as string | undefined) ?? detectRepoTag();
        const now = new Date();
        const id = generateId(now);
        const entry: DevlogEntry = {
          id,
          timestamp: now.toISOString(),
          message,
          tag,
        };
        prependEntry(entry);
        return id;
      }

      case 'today': {
        const allEntries = getEntries();
        const today = new Date().toLocaleDateString('en-CA');
        const todayEntries = allEntries.filter((e) => e.timestamp.slice(0, 10) === today);
        if (values.json) {
          return formatJSON(todayEntries);
        }
        return formatTodayList(todayEntries);
      }

      case 'yesterday': {
        const allEntries = getEntries();
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');
        const yesterdayEntries = allEntries.filter((e) => e.timestamp.slice(0, 10) === yesterdayStr);
        if (values.json) {
          return formatJSON(yesterdayEntries);
        }
        return formatTodayList(yesterdayEntries);
      }

      case 'list': {
        const allEntries = getEntries();
        const limit = values.limit !== undefined ? Math.max(0, parseInt(values.limit as string, 10)) : 20;
        const limited = allEntries.slice(0, limit);
        if (values.json) {
          return formatJSON(limited);
        }
        return formatList(limited);
      }

      case 'week': {
        const allEntries = getEntries();
        const now = new Date();
        const localDateStr = now.toLocaleDateString('en-CA');
        const localDate = new Date(localDateStr + 'T00:00:00');
        localDate.setDate(localDate.getDate() - 6);
        const cutoff = localDate.toISOString();
        const weekEntries = allEntries.filter((e) => e.timestamp >= cutoff);
        return formatWeekMarkdown(weekEntries);
      }

      default:
        return `Unknown command: ${command}\n\n${USAGE}`;
    }
  } catch (err) {
    const path = join(homedir(), '.devlog', 'entries.json');
    return `Error: Failed to read or write ${path}\n${err instanceof Error ? err.message : String(err)}`;
  }
}

export function run(args?: string[]): void {
  const output = main(args);
  if (output.startsWith('Error:') || output.startsWith('Unknown command:')) {
    console.error(output);
    process.exit(1);
  }
  if (output) console.log(output);
}

// Auto-run when executed directly (not during tests)
if (!process.env.VITEST) {
  run();
}

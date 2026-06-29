"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
exports.run = run;
const node_util_1 = require("node:util");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const git_1 = require("./git");
const storage_1 = require("./storage");
const formatter_1 = require("./formatter");
const USAGE = 'Usage: devlog <command> [options]\n\nCommands:\n  add <message>  Log an entry\n  today          Show today\'s entries\n  yesterday      Show yesterday\'s entries\n  list           Show recent entries\n  week           Generate weekly markdown summary';
function generateId(date) {
    return (date ?? new Date()).toISOString().replace(/:/g, '-').replace(/\.(\d{3})Z$/, '-$1');
}
function main(args) {
    try {
        const { values, positionals } = (0, node_util_1.parseArgs)({
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
                const tag = values.tag ?? (0, git_1.detectRepoTag)();
                const now = new Date();
                const id = generateId(now);
                const entry = {
                    id,
                    timestamp: now.toISOString(),
                    message,
                    tag,
                };
                (0, storage_1.prependEntry)(entry);
                return id;
            }
            case 'today': {
                const allEntries = (0, storage_1.getEntries)();
                const today = new Date().toLocaleDateString('en-CA');
                const todayEntries = allEntries.filter((e) => e.timestamp.slice(0, 10) === today);
                if (values.json) {
                    return (0, formatter_1.formatJSON)(todayEntries);
                }
                return (0, formatter_1.formatTodayList)(todayEntries);
            }
            case 'yesterday': {
                const allEntries = (0, storage_1.getEntries)();
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toLocaleDateString('en-CA');
                const yesterdayEntries = allEntries.filter((e) => e.timestamp.slice(0, 10) === yesterdayStr);
                if (values.json) {
                    return (0, formatter_1.formatJSON)(yesterdayEntries);
                }
                return (0, formatter_1.formatTodayList)(yesterdayEntries);
            }
            case 'list': {
                const allEntries = (0, storage_1.getEntries)();
                const limit = values.limit !== undefined ? Math.max(0, parseInt(values.limit, 10)) : 20;
                const limited = allEntries.slice(0, limit);
                if (values.json) {
                    return (0, formatter_1.formatJSON)(limited);
                }
                return (0, formatter_1.formatList)(limited);
            }
            case 'week': {
                const allEntries = (0, storage_1.getEntries)();
                const now = new Date();
                const localDateStr = now.toLocaleDateString('en-CA');
                const localDate = new Date(localDateStr + 'T00:00:00');
                localDate.setDate(localDate.getDate() - 6);
                const cutoff = localDate.toISOString();
                const weekEntries = allEntries.filter((e) => e.timestamp >= cutoff);
                return (0, formatter_1.formatWeekMarkdown)(weekEntries);
            }
            default:
                return `Unknown command: ${command}\n\n${USAGE}`;
        }
    }
    catch (err) {
        const path = (0, node_path_1.join)((0, node_os_1.homedir)(), '.devlog', 'entries.json');
        return `Error: Failed to read or write ${path}\n${err instanceof Error ? err.message : String(err)}`;
    }
}
function run(args) {
    const output = main(args);
    if (output.startsWith('Error:') || output.startsWith('Unknown command:')) {
        console.error(output);
        process.exit(1);
    }
    if (output)
        console.log(output);
}
// Auto-run when executed directly (not during tests)
if (!process.env.VITEST) {
    run();
}

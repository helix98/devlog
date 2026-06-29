"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const node_util_1 = require("node:util");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const git_1 = require("./git");
const storage_1 = require("./storage");
const formatter_1 = require("./formatter");
function generateId() {
    return new Date().toISOString().replace(/:/g, '-').replace(/\.(\d{3})Z$/, '-$1');
}
function main(args) {
    try {
        const { values, positionals } = (0, node_util_1.parseArgs)({
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
                const tag = (0, git_1.detectRepoTag)();
                const id = generateId();
                const entry = {
                    id,
                    timestamp: new Date().toISOString(),
                    message,
                    tag,
                };
                (0, storage_1.prependEntry)(entry);
                return id;
            }
            case 'today': {
                const allEntries = (0, storage_1.getEntries)();
                const today = new Date().toISOString().slice(0, 10);
                const todayEntries = allEntries.filter((e) => e.timestamp.slice(0, 10) === today);
                if (values.json) {
                    return (0, formatter_1.formatJSON)(todayEntries);
                }
                return (0, formatter_1.formatTodayList)(todayEntries);
            }
            case 'list': {
                const allEntries = (0, storage_1.getEntries)();
                const limit = parseInt(values.limit, 10) || 20;
                const limited = allEntries.slice(0, limit);
                if (values.json) {
                    return (0, formatter_1.formatJSON)(limited);
                }
                return (0, formatter_1.formatList)(limited);
            }
            case 'week': {
                const allEntries = (0, storage_1.getEntries)();
                const now = new Date();
                const sevenDaysAgo = new Date(now);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                sevenDaysAgo.setHours(0, 0, 0, 0);
                const cutoff = sevenDaysAgo.toISOString();
                const weekEntries = allEntries.filter((e) => e.timestamp >= cutoff);
                weekEntries.reverse();
                return (0, formatter_1.formatWeekMarkdown)(weekEntries);
            }
            default:
                return `Unknown command: ${command}\n\nCommands:\n  add <message>  Log an entry\n  today          Show today's entries\n  list           Show recent entries\n  week           Generate weekly markdown summary`;
        }
    }
    catch (err) {
        const path = (0, node_path_1.join)((0, node_os_1.homedir)(), '.devlog', 'entries.json');
        return `Error: Failed to read or write ${path}\n${err instanceof Error ? err.message : String(err)}`;
    }
}
// Auto-run when executed directly (not during tests)
if (!process.env.VITEST) {
    const output = main();
    if (output)
        console.log(output);
}

# devlog

[![npm version](https://img.shields.io/npm/v/@helix_dev/devlog)](https://www.npmjs.com/package/@helix_dev/devlog)
[![MIT license](https://img.shields.io/npm/l/@helix_dev/devlog)](LICENSE)

A zero-dependency CLI for maintaining a structured daily coding journal from the terminal.

```bash
devlog add "Fixed the auth redirect"
devlog today
devlog week
```

## Install

```bash
npm install -g @helix_dev/devlog
```

Requires Node.js 18+.

## Commands

| Command | Description |
|---------|-------------|
| `add <message>` | Log an entry with auto-detected git repo tag |
| `today` | Show today's entries (newest first) |
| `yesterday` | Show yesterday's entries (newest first) |
| `list` | Show recent entries (newest first, default 20) |
| `week` | Generate a weekly markdown summary |

### `devlog add <message> [--tag <name>]`

Creates a journal entry with the current timestamp and auto-detected git repository name.

```bash
devlog add "Fixed the login bug"
# → 2026-06-29T14-30-00-123
devlog add "WIP: rate limiting"
# → 2026-06-29T15-45-12-456
```

Prints the entry ID on success. Tags are derived from the git remote URL or folder name; falls back to `uncategorized`. Use `--tag` to override:

```bash
devlog add "Pushed to production" --tag deploy
```

### `devlog today [--json]`

Lists entries created today, newest first.

```bash
devlog today
# 15:45  [devlog] WIP: rate limiting
# 14:30  [devlog] Fixed the login bug
```

```bash
devlog today --json
# [{"id":"2026-06-29T15-45-12-456","timestamp":"2026-06-29T15:45:12.456Z","message":"WIP: rate limiting","tag":"devlog"},...]
```

### `devlog yesterday [--json]`

Lists entries created yesterday. Same format as `today`.

```bash
devlog yesterday
# 09:12  [api] Added rate limiting
```

### `devlog list [--limit N] [--json]`

Shows recent entries, newest first (default 20).

```bash
devlog list --limit 5
# 2026-06-29 15:45  [devlog] WIP: rate limiting
# 2026-06-29 14:30  [devlog] Fixed the login bug
# 2026-06-28 09:12  [api] Added rate limiting
```

### `devlog week`

Generates a markdown summary of the past 7 calendar days, grouped by date with entries in chronological order.

```bash
devlog week
# # Devlog: June 23 – June 29, 2026
#
# ## Monday, June 23
# - Fixed the auth redirect
#
# ## Tuesday, June 24
# - Added rate limiting
```

Pipe to a file to save:

```bash
devlog week > journal.md
```

## Why?

You already write meaningful commit messages, but commits are per-repo, per-change snapshots. A devlog is **your** narrative — what you worked on, across repos, across days. It's useful for:

- **Standups** — your `devlog today` output is your morning report
- **Weekly reviews** — `devlog week` feeds directly into retro notes
- **Context switching** — pick up where you left off after a distraction
- **Distraction accounting** — see exactly how much the Slack notification cost you

The data is just JSON at `~/.devlog/entries.json`. Own it, back it up, script against it.

## Workflow Tip: Daily Commit Reminder

Add to your shell RC to prompt for an end-of-day entry:

```bash
# .zshrc or .bashrc
alias devlog-end="devlog add \"$(git log --oneline --since=9am --format='%s' | head -5 | paste -sd '; ')\""
```

Or pair with a cron / launchd job to ask `devlog today` every evening:

```bash
# crontab example: show today's entries at 5pm
0 17 * * 1-5 devlog today 2>/dev/null || true
```

## GitHub Actions Example

Use devlog in a daily CI workflow to log activity across your repos:

```yaml
# .github/workflows/devlog.yml
name: Daily Devlog
on:
  schedule:
    - cron: '0 22 * * 1-5'  # weekdays at 5pm ET
  workflow_dispatch:         # manual trigger

jobs:
  log:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g @helix_dev/devlog
      - run: devlog add "Automated daily log from CI"
```

## Programmatic API

Import modules directly for scripting:

```typescript
import { main } from '@helix_dev/devlog/src/cli';

// Run a command (returns string output)
const result = main(['add', 'Refactored the parser']);
```

```typescript
import { getEntries, prependEntry } from '@helix_dev/devlog/src/storage';
import { DevlogEntry } from '@helix_dev/devlog/src/types';

// Read all entries
const entries = getEntries();

// Create an entry manually
const entry: DevlogEntry = {
  id: '2026-06-29T14-30-00-123',
  timestamp: new Date().toISOString(),
  message: 'Refactored the parser',
  tag: 'my-repo',
};
prependEntry(entry);
```

```typescript
import { formatList, formatJSON, formatWeekMarkdown } from '@helix_dev/devlog/src/formatter';
```

```typescript
import { detectRepoTag } from '@helix_dev/devlog/src/git';

const tag = detectRepoTag(); // → 'my-repo' or 'uncategorized'
```

## Data

Entries are stored at `~/.devlog/entries.json` in a versioned envelope:

```json
{
  "version": 1,
  "entries": [
    { "id": "2026-06-29T14-30-00-123", "timestamp": "2026-06-29T14:30:00.123Z", "message": "Fixed the login bug", "tag": "devlog" }
  ]
}
```

Writes are atomic (write to `.tmp`, then rename). Corrupt files produce a clear error message with the file path.

## License

MIT

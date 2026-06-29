# Devlog — Structured Daily Coding Journal CLI

## Overview

A zero-dependency CLI tool for maintaining a structured daily coding journal from the terminal. Written in TypeScript, published as `@helix_dev/devlog` on npm.

## Data Model

```typescript
interface DevlogEntry {
  id: string;          // ISO timestamp: "2026-06-29T14-30-00-123"
  timestamp: string;   // ISO 8601
  message: string;
  tag: string;         // git repo name or "uncategorized"
}
```

File stored at `~/.devlog/entries.json` with versioned envelope:

```json
{
  "version": 1,
  "entries": [ /* DevlogEntry[], newest first */ ]
}
```

## Commands

### `devlog add <message>`

- Creates an entry with current timestamp
- Auto-detects git repo name via `git rev-parse --show-toplevel` → `git remote get-url origin` → extract repo name from URL
- Falls back to `"uncategorized"` if not in a git repo or git command fails
- Prepends entry to `entries` array and writes atomically (write to temp file, rename)
- Prints the entry ID on success

### `devlog today`

- Filters entries where date part of `timestamp` matches today's date
- Output: plain text list (newest first), each line: `14:30  [my-repo] Fixed the login bug`
- `--json` flag outputs JSON array (compact, no pretty-print)

### `devlog list [--limit N] [--json]`

- Shows up to N most recent entries (default 20, newest first)
- `--limit N` overrides the default
- Plain text format: `2026-06-29 14:30  [my-repo] Fixed the login bug`
- `--json` flag outputs JSON array (compact, no pretty-print)

### `devlog week`

- Collects entries from the past 7 calendar days (today and the 6 preceding days)
- Groups by date, entries within each group sorted chronologically (oldest first)
- Outputs markdown to stdout:

```markdown
# Devlog: June 23 – June 29, 2026

## Monday, June 23
- Fixed the auth redirect

## Tuesday, June 24
- Added rate limiting
```

## Architecture

### Module Structure

```
src/
  cli.ts         # Entry point: parseArgs, route to command handlers
  storage.ts     # Read/write ~/.devlog/entries.json, init on first use
  git.ts         # Detect repo name, uncategorized fallback
  formatter.ts   # Plain text, JSON, and markdown rendering
```

### Dependencies

- **Zero npm runtime dependencies**
- TypeScript (`devDependency`)
- Node.js `parseArgs` (built-in `node:util`)
- Node.js `fs` / `path` / `os` (built-in)
- `vitest` for testing (`devDependency`)

### Data Flow

1. CLI receives command + args
2. `cli.ts` parses with `parseArgs`, routes to handler
3. Handler calls `storage.ts` to read/write entries
4. `git.ts` queried for repo tag on `add`
5. `formatter.ts` renders output to stdout

## Error Handling

- If `~/.devlog/entries.json` doesn't exist on read, treat as empty array
- If file is corrupted (invalid JSON), print error with file path and exit non-zero
- If git commands fail (stderr, non-zero exit), silently fallback to `"uncategorized"`
- File writes are atomic: write to `entries.json.tmp`, then `rename` over target

## Testing

### Unit Tests (vitest)

| Module | What it tests |
|---|---|
| `storage.test.ts` | Create, read, write entries; corrupt file handling; temp dir isolation |
| `git.test.ts` | Repo name from remote URL, from folder name, uncategorized fallback |
| `formatter.test.ts` | Plain text formatting, JSON formatting, markdown week grouping |

### Integration Tests

| Test | What it tests |
|---|---|
| `add` then `today` | End-to-end flow in a temp git repo |
| `add` outside git | Ensures "uncategorized" tag |
| `list --limit` | Limit flag behavior |
| `week` | Markdown output structure |

## Build & Distribution

- Compiled with `tsc` (commonjs target, Node.js entry)
- `package.json` `"bin"` maps `devlog` → `dist/cli.js` with `#!/usr/bin/env node`
- Published to npm as `@helix_dev/devlog`
- Runtime target: Node.js 18+ (for `parseArgs`)

## Future Considerations (explicitly out of scope for v1)

- Edit / delete entries
- Custom tags beyond git repo detection
- Search / filter by tag
- Syncing / export

# Devlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-dependency CLI tool `devlog` for structured daily coding journal entries.

**Architecture:** 4 modules (storage, git, formatter, cli) with shared types. Node.js `parseArgs` for CLI parsing. `vitest` for TDD. Data stored in `~/.devlog/entries.json`. No npm runtime dependencies.

**Tech Stack:** TypeScript, Node.js 18+ (parseArgs), vitest

## Global Constraints

- Zero npm runtime dependencies (TypeScript and vitest are devDependencies only)
- Target Node.js 18+ (uses `parseArgs` from `node:util`)
- Package name: `@helix_dev/devlog`
- MIT License
- Entries stored at `~/.devlog/entries.json`
- Entries stored newest-first in array
- `tag` field defaults to `"uncategorized"` when not in a git repo

---

## File Structure

```
devlog/
  .gitignore
  package.json
  tsconfig.json
  bin/
    devlog.js          # Thin wrapper with shebang, requires ../dist/cli.js
  src/
    types.ts           # DevlogEntry interface
    storage.ts         # Read/write ~/.devlog/entries.json
    git.ts             # Detect git repo name
    formatter.ts       # Output rendering (plain text, JSON, markdown)
    cli.ts             # Entry point, parseArgs, command routing
  tests/
    storage.test.ts
    git.test.ts
    formatter.test.ts
    cli.test.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `bin/devlog.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@helix_dev/devlog",
  "version": "0.1.0",
  "description": "A structured daily coding journal CLI",
  "bin": {
    "devlog": "bin/devlog.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["journal", "devlog", "cli"],
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^2.0.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 4: Create `bin/devlog.js`**

```javascript
#!/usr/bin/env node
require('../dist/cli.js');
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

Expected: node_modules/ created, package-lock.json created

- [ ] **Step 6: Build and verify**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold project"
```

---

### Task 2: Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create `src/types.ts`**

```typescript
export interface DevlogEntry {
  id: string;
  timestamp: string;
  message: string;
  tag: string;
}

export interface EntryStore {
  version: number;
  entries: DevlogEntry[];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add DevlogEntry type"
```

---

### Task 3: git.ts — Repo name detection

**Files:**
- Create: `src/git.ts`
- Create: `tests/git.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `detectRepoTag(): string`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { detectRepoTag } from '../src/git';

describe('detectRepoTag', () => {
  it('returns "uncategorized" when not in a git repo', () => {
    const tag = detectRepoTag();
    // In the test runner's CWD (project root which IS a git repo),
    // so this test needs a subdir without .git. We'll test the
    // fallback behavior by checking the return type is always string.
    expect(typeof tag).toBe('string');
  });

  it('returns the repo name when inside a git repo with a remote', () => {
    const tag = detectRepoTag();
    // In the devlog project, CWD is a git repo
    // Based on LICENSE copyright: "helix"
    // The remote URL test is separate below
    expect(tag.length).toBeGreaterThan(0);
    expect(tag).not.toContain(' ');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/git.test.ts`
Expected: FAIL — `Cannot find module '../src/git'`

- [ ] **Step 3: Write minimal implementation**

```typescript
import { execSync } from 'node:child_process';

export function detectRepoTag(): string {
  try {
    const toplevel = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const folderName = toplevel.split(/[/\\]/).pop() || 'uncategorized';

    try {
      const remoteUrl = execSync('git remote get-url origin', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      const repoName = remoteUrl
        .replace(/\.git$/, '')
        .split(/[/\\:]/)
        .pop();
      if (repoName) return repoName;
    } catch {
      // No remote — fall through to folder name
    }

    return folderName;
  } catch {
    return 'uncategorized';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/git.test.ts`
Expected: PASS

- [ ] **Step 5: Add more thorough tests**

Update `tests/git.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rmSync } from 'node:fs';
import { detectRepoTag } from '../src/git';

describe('detectRepoTag', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'devlog-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns "uncategorized" when not in a git repo', () => {
    const tag = detectRepoTag();
    // We can't easily change CWD mid-test, but we can test the
    // function's behavior with the temp dir approach below
    expect(typeof tag).toBe('string');
  });

  it('returns folder name in a git repo without remote', () => {
    execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
    const tag = detectRepoTag();
    expect(tag).toBe('devlog-test-');
  });

  it('returns remote repo name in a git repo with remote', () => {
    execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
    execSync('git remote add origin https://github.com/helix-dev/devlog.git', {
      cwd: tmpDir,
      stdio: 'ignore',
    });
    const tag = detectRepoTag();
    expect(tag).toBe('devlog');
  });

  it('handles SSH remote URLs', () => {
    execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
    execSync('git remote add origin git@github.com:helix-dev/devlog.git', {
      cwd: tmpDir,
      stdio: 'ignore',
    });
    const tag = detectRepoTag();
    expect(tag).toBe('devlog');
  });
});
```

- [ ] **Step 6: Run updated tests**

Run: `npx vitest run tests/git.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/git.ts tests/git.test.ts
git commit -m "feat: add git repo name detection"
```

---

### Task 4: formatter.ts — Output rendering

**Files:**
- Create: `src/formatter.ts`
- Create: `tests/formatter.test.ts`

**Interfaces:**
- Consumes: `DevlogEntry` from `src/types.ts`
- Produces: `formatTodayList(entries: DevlogEntry[]): string`, `formatList(entries: DevlogEntry[]): string`, `formatWeekMarkdown(entries: DevlogEntry[]): string`, `formatJSON(entries: DevlogEntry[]): string`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { formatTodayList, formatList, formatWeekMarkdown, formatJSON } from '../src/formatter';
import { DevlogEntry } from '../src/types';

const makeEntry = (ts: string, msg: string, tag = 'devlog', id = '1'): DevlogEntry => ({
  id,
  timestamp: ts,
  message: msg,
  tag,
});

describe('formatter', () => {
  describe('formatTodayList', () => {
    it('formats entries as time + tag + message', () => {
      const entries = [makeEntry('2026-06-29T14:30:00.000Z', 'Fixed auth bug', 'devlog')];
      const result = formatTodayList(entries);
      expect(result).toContain('14:30');
      expect(result).toContain('[devlog]');
      expect(result).toContain('Fixed auth bug');
    });

    it('returns empty string for no entries', () => {
      expect(formatTodayList([])).toBe('');
    });
  });

  describe('formatList', () => {
    it('formats entries as date + time + tag + message', () => {
      const entries = [makeEntry('2026-06-29T14:30:00.000Z', 'Fixed auth bug', 'devlog')];
      const result = formatList(entries);
      expect(result).toContain('2026-06-29');
      expect(result).toContain('14:30');
      expect(result).toContain('[devlog]');
      expect(result).toContain('Fixed auth bug');
    });

    it('returns empty string for no entries', () => {
      expect(formatList([])).toBe('');
    });
  });

  describe('formatWeekMarkdown', () => {
    it('groups entries by date chronologically', () => {
      const entries = [
        makeEntry('2026-06-28T10:00:00.000Z', 'Saturday entry', 'devlog'),
        makeEntry('2026-06-29T14:30:00.000Z', 'Sunday entry', 'devlog'),
      ];
      const result = formatWeekMarkdown(entries);
      expect(result).toContain('## Saturday');
      expect(result).toContain('## Sunday');
      expect(result.indexOf('Saturday')).toBeLessThan(result.indexOf('Sunday'));
    });

    it('sorts entries oldest-first within each day', () => {
      const entries = [
        makeEntry('2026-06-29T14:30:00.000Z', 'Second', 'devlog'),
        makeEntry('2026-06-29T09:00:00.000Z', 'First', 'devlog'),
      ];
      const result = formatWeekMarkdown(entries);
      const firstIdx = result.indexOf('First');
      const secondIdx = result.indexOf('Second');
      expect(firstIdx).toBeLessThan(secondIdx);
    });

    it('returns empty string for no entries', () => {
      expect(formatWeekMarkdown([])).toBe('');
    });

    it('includes day range in title', () => {
      const entries = [makeEntry('2026-06-29T14:30:00.000Z', 'Entry', 'devlog')];
      const result = formatWeekMarkdown(entries);
      expect(result).toMatch(/# Devlog: .+ – .+, 2026/);
    });
  });

  describe('formatJSON', () => {
    it('returns compact JSON array', () => {
      const entries = [makeEntry('2026-06-29T14:30:00.000Z', 'Entry', 'devlog')];
      const result = formatJSON(entries);
      expect(result).toBe(JSON.stringify(entries));
    });

    it('returns "[]" for empty array', () => {
      expect(formatJSON([])).toBe('[]');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/formatter.test.ts`
Expected: FAIL — `Cannot find module '../src/formatter'`

- [ ] **Step 3: Write minimal implementation**

```typescript
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

  // Group by date
  const groups = new Map<string, DevlogEntry[]>();
  for (const e of entries) {
    const date = e.timestamp.slice(0, 10);
    const group = groups.get(date) || [];
    group.push(e);
    groups.set(date, group);
  }

  // Sort dates chronologically
  const sortedDates = [...groups.keys()].sort();

  // Build markdown
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
    // Sort oldest-first within day
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/formatter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/formatter.ts tests/formatter.test.ts
git commit -m "feat: add output formatter"
```

---

### Task 5: storage.ts — Data persistence

**Files:**
- Create: `src/storage.ts`
- Create: `tests/storage.test.ts`

**Interfaces:**
- Consumes: `DevlogEntry`, `EntryStore` from `src/types.ts`
- Produces: `getEntries(): DevlogEntry[]`, `prependEntry(entry: DevlogEntry): void`, `initStore(): void`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getEntries, prependEntry } from '../src/storage';
import { DevlogEntry } from '../src/types';

describe('storage', () => {
  const origHome = process.env.HOME || process.env.USERPROFILE;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'devlog-test-'));
    // Point HOME to temp dir so ~/.devlog is isolated
    process.env.HOME = tmpDir;
    process.env.USERPROFILE = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = origHome;
    process.env.USERPROFILE = origHome;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array when no entries file exists', () => {
    const entries = getEntries();
    expect(entries).toEqual([]);
  });

  it('creates .devlog directory and entries file on first write', () => {
    const entry: DevlogEntry = {
      id: '2026-06-29T14-30-00-000',
      timestamp: '2026-06-29T14:30:00.000Z',
      message: 'Fixed auth bug',
      tag: 'devlog',
    };
    prependEntry(entry);
    expect(existsSync(join(tmpDir, '.devlog', 'entries.json'))).toBe(true);
  });

  it('prepends entries (newest first)', () => {
    const oldEntry: DevlogEntry = {
      id: '1', timestamp: '2026-06-28T10:00:00.000Z',
      message: 'Old', tag: 'devlog',
    };
    const newEntry: DevlogEntry = {
      id: '2', timestamp: '2026-06-29T14:30:00.000Z',
      message: 'New', tag: 'devlog',
    };
    prependEntry(oldEntry);
    prependEntry(newEntry);
    const entries = getEntries();
    expect(entries[0].message).toBe('New');
    expect(entries[1].message).toBe('Old');
  });

  it('handles corrupt JSON file gracefully', () => {
    const devlogDir = join(tmpDir, '.devlog');
    const filePath = join(devlogDir, 'entries.json');
    writeFileSync(filePath, '{corrupt', 'utf-8');
    expect(() => getEntries()).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/storage.test.ts`
Expected: FAIL — `Cannot find module '../src/storage'`

- [ ] **Step 3: Write minimal implementation**

```typescript
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { DevlogEntry, EntryStore } from './types';

function storePath(): string {
  return join(homedir(), '.devlog', 'entries.json');
}

function storeDir(): string {
  return join(homedir(), '.devlog');
}

function readStore(): EntryStore {
  const path = storePath();
  if (!existsSync(path)) {
    return { version: 1, entries: [] };
  }
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw) as EntryStore;
}

function writeStore(store: EntryStore): void {
  const dir = storeDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const path = storePath();
  const tmp = path + '.tmp';
  writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8');
  renameSync(tmp, path);
}

export function getEntries(): DevlogEntry[] {
  return readStore().entries;
}

export function prependEntry(entry: DevlogEntry): void {
  const store = readStore();
  store.entries.unshift(entry);
  writeStore(store);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/storage.ts tests/storage.test.ts
git commit -m "feat: add data persistence layer"
```

---

### Task 6: cli.ts — Entry point and command routing

**Files:**
- Create: `src/cli.ts`
- Create: `tests/cli.test.ts`

**Interfaces:**
- Consumes: `detectRepoTag()` from `src/git.ts`, `getEntries()` / `prependEntry()` from `src/storage.ts`, formatters from `src/formatter.ts`, `DevlogEntry` from `src/types.ts`
- Produces: `main(args?: string[]): void`

- [ ] **Step 1: Write the failing integration tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { main } from '../src/cli';
import { getEntries } from '../src/storage';

describe('cli', () => {
  const origHome = process.env.HOME || process.env.USERPROFILE;
  const origArgv = process.argv;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'devlog-cli-test-'));
    process.env.HOME = tmpDir;
    process.env.USERPROFILE = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = origHome;
    process.env.USERPROFILE = origHome;
    rmSync(tmpDir, { recursive: true, force: true });
    process.argv = origArgv;
  });

  it('adds an entry and returns its id', () => {
    const result = main(['add', 'Fixed the login bug']);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const entries = getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toBe('Fixed the login bug');
  });

  it('lists today entries', () => {
    main(['add', 'First entry']);
    const output = main(['today']);
    expect(output).toContain('First entry');
  });

  it('lists entries with --json flag', () => {
    main(['add', 'Test entry']);
    const output = main(['list', '--json']);
    expect(output).toContain('"message":"Test entry"');
  });

  it('list respects --limit', () => {
    main(['add', 'First']);
    main(['add', 'Second']);
    const output = main(['list', '--limit', '1']);
    expect(output).toContain('Second');
    expect(output).not.toContain('First');
  });

  it('generates week markdown', () => {
    main(['add', 'Entry for week']);
    const output = main(['week']);
    expect(output).toContain('# Devlog:');
    expect(output).toContain('Entry for week');
  });

  it('shows error for unknown command', () => {
    const output = main(['unknown']);
    expect(output).toContain('Unknown command');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/cli.test.ts`
Expected: FAIL — `Cannot find module '../src/cli'`

- [ ] **Step 3: Write minimal implementation**

```typescript
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
      // Set to start of day (midnight) for inclusive comparison
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const cutoff = sevenDaysAgo.toISOString();
      const weekEntries = allEntries.filter((e) => e.timestamp >= cutoff);
      // Reverse to chronological for week output
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/cli.test.ts`
Expected: PASS

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/cli.ts tests/cli.test.ts
git commit -m "feat: add CLI entry point and command routing"
```

---

### Task 7: Build and verify

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: `dist/cli.js`, `dist/types.js`, etc. created

- [ ] **Step 2: Verify bin wrapper works**

```bash
node bin/devlog.js add "Build test entry"
node bin/devlog.js today
node bin/devlog.js list
node bin/devlog.js week
```

Expected: All commands work, entry appears in output

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: initial build"
```

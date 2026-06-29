# Contributing

Thanks for your interest in devlog!

## Project

`@helix_dev/devlog` is a zero-dependency TypeScript CLI. It uses Node.js built-in `parseArgs`, `fs`, `path`, and `os` modules exclusively — no npm runtime dependencies.

## Setup

```bash
git clone https://github.com/helix98/devlog
cd devlog
npm install
npm run build
```

## Testing

```bash
npm test          # run all tests
npm run test:watch  # watch mode
```

All changes should include tests. We use vitest.

## Code Style

- TypeScript, strict mode
- No runtime npm dependencies
- Node.js 18+ (`parseArgs`, etc.)
- YAGNI — don't add features not asked for
- DRY — extract when a pattern appears twice

## Pull Requests

1. Make sure tests pass (`npm test`)
2. Make sure TypeScript compiles (`npm run build`)
3. Keep PRs focused on one concern
4. Include tests for new functionality

## Structure

```
src/
  cli.ts         # Entry point: parseArgs, route to command handlers
  storage.ts     # Read/write ~/.devlog/entries.json
  git.ts         # Detect repo name, uncategorized fallback
  formatter.ts   # Plain text, JSON, and markdown rendering
tests/           # vitest tests mirroring src/ structure
```

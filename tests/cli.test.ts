import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
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

  it('today --json returns JSON output', () => {
    main(['add', 'JSON entry']);
    const output = main(['today', '--json']);
    expect(output).toContain('"message":"JSON entry"');
    expect(() => JSON.parse(output)).not.toThrow();
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

  it('handles corrupt storage file gracefully', () => {
    const devlogDir = join(tmpDir, '.devlog');
    const filePath = join(devlogDir, 'entries.json');
    mkdirSync(devlogDir, { recursive: true });
    writeFileSync(filePath, '{corrupt', 'utf-8');
    const output = main(['list']);
    expect(output).toMatch(/^Error:/);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getEntries, prependEntry } from '../src/storage';
import { DevlogEntry } from '../src/types';

describe('storage', () => {
  const origHome = process.env.HOME || process.env.USERPROFILE;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'devlog-test-'));
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
    mkdirSync(devlogDir, { recursive: true });
    writeFileSync(filePath, '{corrupt', 'utf-8');
    expect(() => getEntries()).toThrow();
  });
});

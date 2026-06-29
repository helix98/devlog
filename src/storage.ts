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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
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
    const tag = detectRepoTag(tmpDir);
    expect(tag).toBe('uncategorized');
  });

  it('returns folder name in a git repo without remote', () => {
    execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
    const tag = detectRepoTag(tmpDir);
    expect(tag).toBe(tmpDir.split(/[/\\]/).pop());
  });

  it('returns remote repo name in a git repo with remote', () => {
    execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
    execSync('git remote add origin https://github.com/helix-dev/devlog.git', {
      cwd: tmpDir,
      stdio: 'ignore',
    });
    const tag = detectRepoTag(tmpDir);
    expect(tag).toBe('devlog');
  });

  it('handles SSH remote URLs', () => {
    execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
    execSync('git remote add origin git@github.com:helix-dev/devlog.git', {
      cwd: tmpDir,
      stdio: 'ignore',
    });
    const tag = detectRepoTag(tmpDir);
    expect(tag).toBe('devlog');
  });
});

import { execSync } from 'node:child_process';

export function detectRepoTag(cwd?: string): string {
  const opts = cwd ? { cwd } : {};
  try {
    const toplevel = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      ...opts,
    }).trim();
    const folderName = toplevel.split(/[/\\]/).pop() || 'uncategorized';

    try {
      const remoteUrl = execSync('git remote get-url origin', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
        ...opts,
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

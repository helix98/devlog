"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectRepoTag = detectRepoTag;
const node_child_process_1 = require("node:child_process");
function detectRepoTag(cwd) {
    const opts = cwd ? { cwd } : {};
    try {
        const toplevel = (0, node_child_process_1.execSync)('git rev-parse --show-toplevel', {
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore'],
            ...opts,
        }).trim();
        const folderName = toplevel.split(/[/\\]/).pop() || 'uncategorized';
        try {
            const remoteUrl = (0, node_child_process_1.execSync)('git remote get-url origin', {
                encoding: 'utf-8',
                stdio: ['ignore', 'pipe', 'ignore'],
                ...opts,
            }).trim();
            const repoName = remoteUrl
                .replace(/\.git$/, '')
                .split(/[/\\:]/)
                .pop();
            if (repoName)
                return repoName;
        }
        catch {
            // No remote — fall through to folder name
        }
        return folderName;
    }
    catch {
        return 'uncategorized';
    }
}

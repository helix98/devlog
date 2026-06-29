"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntries = getEntries;
exports.prependEntry = prependEntry;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
function storePath() {
    return (0, node_path_1.join)((0, node_os_1.homedir)(), '.devlog', 'entries.json');
}
function storeDir() {
    return (0, node_path_1.join)((0, node_os_1.homedir)(), '.devlog');
}
function readStore() {
    const path = storePath();
    if (!(0, node_fs_1.existsSync)(path)) {
        return { version: 1, entries: [] };
    }
    const raw = (0, node_fs_1.readFileSync)(path, 'utf-8');
    return JSON.parse(raw);
}
function writeStore(store) {
    const dir = storeDir();
    if (!(0, node_fs_1.existsSync)(dir)) {
        (0, node_fs_1.mkdirSync)(dir, { recursive: true });
    }
    const path = storePath();
    const tmp = path + '.tmp';
    (0, node_fs_1.writeFileSync)(tmp, JSON.stringify(store, null, 2), 'utf-8');
    (0, node_fs_1.renameSync)(tmp, path);
}
function getEntries() {
    return readStore().entries;
}
function prependEntry(entry) {
    const store = readStore();
    store.entries.unshift(entry);
    writeStore(store);
}

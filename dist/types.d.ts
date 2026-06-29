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

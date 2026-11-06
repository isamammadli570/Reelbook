import type {Library, LibraryItem} from "@/api/library.api";

/** What the server holds for one record: the value, or `null` when it was deleted (a tombstone). */
export type Versioned<T> = {updatedAt: string; value: T | null};

/** What the server holds for one library title. */
export type RemoteEntry = {updatedAt: string; item: LibraryItem | null};

/** The newer of two versions; on a tie the local one wins, so an unchanged sync pushes nothing. */
const newer = <T>(local: Versioned<T> | null, remote: Versioned<T> | null): Versioned<T> | null => {
    if (!local) return remote;
    if (!remote) return local;
    return remote.updatedAt > local.updatedAt ? remote : local;
};

/**
 * Merges this device's records with the server's copy. For every key the newer change wins, deletions included.
 * Returns the merged records, their tombstones, and the entries the server must be updated with.
 */
export const mergeVersioned = <T extends {updatedAt: string}>(
    localValues: Record<string, T>,
    localRemoved: Record<string, string>,
    remote: Record<string, Versioned<T>>,
): {values: Record<string, T>; removed: Record<string, string>; outbox: Record<string, Versioned<T>>; changed: boolean} => {
    const values = {...localValues};
    const removed = {...localRemoved};
    const outbox: Record<string, Versioned<T>> = {};
    let changed = false;

    const keys = new Set([...Object.keys(localValues), ...Object.keys(removed), ...Object.keys(remote)]);
    keys.forEach((key) => {
        const localValue = localValues[key];
        const localVersion: Versioned<T> | null = localValue
            ? {updatedAt: localValue.updatedAt, value: localValue}
            : removed[key]
                ? {updatedAt: removed[key], value: null}
                : null;
        const remoteVersion = remote[key] ?? null;
        const winner = newer(localVersion, remoteVersion);
        if (!winner) return;
        // Only a version from the server can change what the device holds.
        if (winner !== localVersion) changed = true;

        if (winner.value) {
            values[key] = winner.value;
            delete removed[key];
        } else {
            delete values[key];
            removed[key] = winner.updatedAt;
        }

        const localIsNewer = localVersion !== null && winner === localVersion;
        if (localIsNewer && (!remoteVersion || remoteVersion.updatedAt < localVersion.updatedAt)) {
            outbox[key] = winner;
        }
    });

    return {values, removed, outbox, changed};
};

/** The library flavour of `mergeVersioned`, keeping the library's own field names. */
export const mergeLibrary = (local: Library, remote: Record<string, RemoteEntry>): {library: Library; outbox: Record<string, RemoteEntry>; changed: boolean} => {
    const remoteVersions = Object.fromEntries(Object.entries(remote).map(([key, entry]) => [key, {updatedAt: entry.updatedAt, value: entry.item}]));
    const {values, removed, outbox, changed} = mergeVersioned(local.items, local.removed ?? {}, remoteVersions);
    return {
        changed,
        library: {items: values, removed},
        outbox: Object.fromEntries(Object.entries(outbox).map(([key, entry]) => [key, {updatedAt: entry.updatedAt, item: entry.value}])),
    };
};

/**
 * Which records the server holds a newer version of than this device (or one the device has never seen).
 * Only their contents need downloading; for the rest the device's copy wins the merge anyway.
 */
export const staleKeys = (localValues: Record<string, {updatedAt: string}>, localRemoved: Record<string, string>, remote: Record<string, string>): string[] =>
    Object.entries(remote)
        .filter(([key, updatedAt]) => {
            const local = localValues[key]?.updatedAt ?? localRemoved[key];
            return !local || updatedAt > local;
        })
        .map(([key]) => key);

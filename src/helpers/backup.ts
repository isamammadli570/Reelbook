import type {Library} from "@/api/library.api";
import type {ListEntry, ListsStore, UserList} from "@/api/lists.api";
import type {Profile} from "@/api/profile.api";
import {DEFAULT_AVATAR_COLOR} from "@/constants/other";

/** Bump when the backup shape changes; versions this app cannot read are refused rather than guessed at. */
export const BACKUP_VERSION = 2;

/** Version 1 predates lists: it still restores, and leaves the lists on the device alone. */
const READABLE_VERSIONS = [1, BACKUP_VERSION];

export type Backup = {
    version: number;
    exportedAt: string;
    library: Library;
    /** `null` for a backup made before lists were included (or converted from another app). */
    lists: ListsStore | null;
    profile: Profile;
};

export const createBackup = (library: Library, lists: ListsStore, profile: Profile, nowIso: string): Backup => ({
    version: BACKUP_VERSION,
    exportedAt: nowIso,
    library,
    lists,
    profile,
});

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

const isEntry = (value: unknown): value is ListEntry =>
    isRecord(value) && typeof value.key === "string" && typeof value.id === "number" && typeof value.mediaType === "string" && typeof value.title === "string";

const toList = (value: unknown): UserList | null => {
    if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
    return {
        id: value.id,
        name: value.name,
        description: typeof value.description === "string" ? value.description : "",
        entries: Array.isArray(value.entries) ? value.entries.filter(isEntry) : [],
        createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
        updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    };
};

/** Keeps the lists that read correctly and drops damaged ones, rather than refusing the whole file. */
const parseLists = (value: unknown): ListsStore | null => {
    if (!isRecord(value) || !isRecord(value.lists)) return null;
    const lists: Record<string, UserList> = {};
    Object.values(value.lists).forEach((raw) => {
        const list = toList(raw);
        if (list) lists[list.id] = list;
    });
    return {lists, removed: isRecord(value.removed) ? (value.removed as Record<string, string>) : {}};
};

/** Returns the backup when the text is a valid export of this app, otherwise `null`. */
export const parseBackup = (text: string): Backup | null => {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        return null;
    }

    if (!isRecord(data) || typeof data.version !== "number" || !READABLE_VERSIONS.includes(data.version)) return null;
    if (!isRecord(data.library) || !isRecord(data.library.items)) return null;
    if (!isRecord(data.profile)) return null;

    const profile = data.profile;
    return {
        version: data.version,
        exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : "",
        library: {
            items: data.library.items as Library["items"],
            removed: isRecord(data.library.removed) ? (data.library.removed as Record<string, string>) : {},
        },
        lists: parseLists(data.lists),
        profile: {
            name: typeof profile.name === "string" ? profile.name : "",
            username: typeof profile.username === "string" ? profile.username : "",
            bio: typeof profile.bio === "string" ? profile.bio : "",
            coverPath: typeof profile.coverPath === "string" ? profile.coverPath : null,
            coverUrl: typeof profile.coverUrl === "string" ? profile.coverUrl : null,
            avatarColor: typeof profile.avatarColor === "string" ? profile.avatarColor : DEFAULT_AVATAR_COLOR,
            avatarUrl: typeof profile.avatarUrl === "string" ? profile.avatarUrl : null,
            shareActivity: typeof profile.shareActivity === "boolean" ? profile.shareActivity : true,
            updatedAt: typeof profile.updatedAt === "string" ? profile.updatedAt : "",
        },
    };
};

/** Whether a backup carries a profile at all: one converted from another app has none to restore. */
export const hasProfile = (profile: Profile): boolean => Boolean(profile.name || profile.username || profile.bio || profile.avatarUrl || profile.coverUrl || profile.coverPath);

export type Restore = {library: Library; lists: ListsStore | null};

const stamp = <T extends {updatedAt: string}>(values: Record<string, T>, nowIso: string): Record<string, T> =>
    Object.fromEntries(Object.entries(values).map(([key, value]) => [key, {...value, updatedAt: nowIso}]));

/** A deletion mark for every key in `known` that the restore does not keep. */
const tombstones = (kept: Record<string, unknown>, known: Record<string, unknown>[], nowIso: string): Record<string, string> =>
    Object.fromEntries(known.flatMap((keys) => Object.keys(keys)).filter((key) => !(key in kept)).map((key) => [key, nowIso]));

/**
 * What the device should hold after restoring. Every restored record is stamped `nowIso`, and whatever the device
 * has that the backup lacks gets a deletion mark with the same stamp, so the restore also wins the next sync
 * instead of being undone by newer-looking copies on the server.
 */
export const prepareRestore = (backup: Backup, current: {library: Library; lists: ListsStore}, nowIso: string): Restore => {
    const items = stamp(backup.library.items, nowIso);
    const library: Library = {
        items,
        removed: tombstones(items, [current.library.items, current.library.removed ?? {}, backup.library.removed ?? {}], nowIso),
    };
    if (!backup.lists) return {library, lists: null};

    const lists = stamp(backup.lists.lists, nowIso);
    return {
        library,
        lists: {lists, removed: tombstones(lists, [current.lists.lists, current.lists.removed ?? {}, backup.lists.removed ?? {}], nowIso)},
    };
};

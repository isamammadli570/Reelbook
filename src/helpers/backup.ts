import type {Library} from "@/api/library.api";
import type {Profile} from "@/api/profile.api";
import {DEFAULT_AVATAR_COLOR} from "@/constants/other";

/** Bump when the backup shape changes; imports of other versions are refused rather than guessed at. */
export const BACKUP_VERSION = 1;

export type Backup = {
    version: number;
    exportedAt: string;
    library: Library;
    profile: Profile;
};

export const createBackup = (library: Library, profile: Profile, nowIso: string): Backup => ({
    version: BACKUP_VERSION,
    exportedAt: nowIso,
    library,
    profile,
});

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Returns the backup when the text is a valid export of this app, otherwise `null`. */
export const parseBackup = (text: string): Backup | null => {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        return null;
    }

    if (!isRecord(data) || data.version !== BACKUP_VERSION) return null;
    if (!isRecord(data.library) || !isRecord(data.library.items)) return null;
    if (!isRecord(data.profile)) return null;

    const profile = data.profile;
    return {
        version: BACKUP_VERSION,
        exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : "",
        library: {
            items: data.library.items as Library["items"],
            removed: isRecord(data.library.removed) ? (data.library.removed as Record<string, string>) : {},
        },
        profile: {
            name: typeof profile.name === "string" ? profile.name : "",
            username: typeof profile.username === "string" ? profile.username : "",
            bio: typeof profile.bio === "string" ? profile.bio : "",
            coverPath: typeof profile.coverPath === "string" ? profile.coverPath : null,
            coverUrl: typeof profile.coverUrl === "string" ? profile.coverUrl : null,
            avatarColor: typeof profile.avatarColor === "string" ? profile.avatarColor : DEFAULT_AVATAR_COLOR,
            avatarUrl: typeof profile.avatarUrl === "string" ? profile.avatarUrl : null,
            shareActivity: typeof profile.shareActivity === "boolean" ? profile.shareActivity : true,
        },
    };
};

/** Whether a backup carries a profile at all: one converted from another app has none to restore. */
export const hasProfile = (profile: Profile): boolean => Boolean(profile.name || profile.username || profile.bio || profile.avatarUrl || profile.coverUrl || profile.coverPath);

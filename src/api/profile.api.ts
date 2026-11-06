import {storage} from "@/lib/storage";
import {STORAGE_KEYS, DEFAULT_AVATAR_COLOR} from "@/constants/other";
import {normalizeUsername} from "@/helpers/username";

/** Who the user is: shown on the profile and uploaded with the account. */
export type Profile = {
    name: string;
    /** Lowercase handle shown as @username; empty until chosen. */
    username: string;
    bio: string;
    /** TMDB backdrop path used as the profile cover, or `null` for the plain cover. */
    coverPath: string | null;
    /** Public address of a cover the user uploaded; shown instead of `coverPath` when set. */
    coverUrl: string | null;
    /** A key of `AVATAR_COLORS`. */
    avatarColor: string;
    /** Public address of the uploaded photo; the coloured initial shows when there is none. */
    avatarUrl: string | null;
    /** Whether people who follow this user see what they watch, rate and review. */
    shareActivity: boolean;
};

export const EMPTY_PROFILE: Profile = {name: "", username: "", bio: "", coverPath: null, coverUrl: null, avatarColor: DEFAULT_AVATAR_COLOR, avatarUrl: null, shareActivity: true};

export const getProfile = async (): Promise<Profile> => ({...EMPTY_PROFILE, ...(await storage.get<Partial<Profile>>(STORAGE_KEYS.PROFILE))});

export const saveProfile = async (profile: Profile): Promise<Profile> => {
    const next: Profile = {
        name: profile.name.trim(),
        username: normalizeUsername(profile.username),
        bio: profile.bio.trim(),
        coverPath: profile.coverPath,
        coverUrl: profile.coverUrl ?? null,
        avatarColor: profile.avatarColor || DEFAULT_AVATAR_COLOR,
        avatarUrl: profile.avatarUrl ?? null,
        shareActivity: profile.shareActivity ?? true,
    };
    await storage.set(STORAGE_KEYS.PROFILE, next);
    return next;
};

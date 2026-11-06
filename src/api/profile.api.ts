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
    /** A key of `AVATAR_COLORS`. */
    avatarColor: string;
    /** Public address of the uploaded photo; the coloured initial shows when there is none. */
    avatarUrl: string | null;
};

export const EMPTY_PROFILE: Profile = {name: "", username: "", bio: "", coverPath: null, avatarColor: DEFAULT_AVATAR_COLOR, avatarUrl: null};

export const getProfile = async (): Promise<Profile> => ({...EMPTY_PROFILE, ...(await storage.get<Partial<Profile>>(STORAGE_KEYS.PROFILE))});

export const saveProfile = async (profile: Profile): Promise<Profile> => {
    const next: Profile = {
        name: profile.name.trim(),
        username: normalizeUsername(profile.username),
        bio: profile.bio.trim(),
        coverPath: profile.coverPath,
        avatarColor: profile.avatarColor || DEFAULT_AVATAR_COLOR,
        avatarUrl: profile.avatarUrl ?? null,
    };
    await storage.set(STORAGE_KEYS.PROFILE, next);
    return next;
};

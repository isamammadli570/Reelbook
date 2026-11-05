import {storage} from "@/lib/storage";
import {STORAGE_KEYS} from "@/constants/other";

/** The only "account" this app has: a name and a line about yourself, kept on the device. */
export type Profile = {
    name: string;
    bio: string;
};

export const EMPTY_PROFILE: Profile = {name: "", bio: ""};

export const getProfile = async (): Promise<Profile> => ({...EMPTY_PROFILE, ...(await storage.get<Profile>(STORAGE_KEYS.PROFILE))});

export const saveProfile = async (profile: Profile): Promise<Profile> => {
    const next = {name: profile.name.trim(), bio: profile.bio.trim()};
    await storage.set(STORAGE_KEYS.PROFILE, next);
    return next;
};

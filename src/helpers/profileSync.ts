import type {Profile} from "@/api/profile.api";

/** What the account itself knows: the handle chosen at sign-up, or the name and photo a Google account brings. */
export type AccountDetails = {username: string | null; name: string | null; avatarUrl: string | null};

export type ProfileMerge = {
    /** The profile this device should hold now. */
    profile: Profile;
    /** The server should get this profile: this device's edit is newer, or the server has none. */
    shouldPush: boolean;
    /** The device's profile changed, so the screen should refresh. */
    changed: boolean;
};

const isSame = (a: Profile, b: Profile): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Reconciles this device's profile with the server's: the more recent edit wins, whole, by its edit time.
 * Before, the device's copy always won and was uploaded on every start, so an old copy on one device
 * quietly undid a newer edit made on another. A profile never edited anywhere (no edit time) takes what the
 * account knows, such as a Google name and photo, and that counts as an edit so it reaches other devices.
 */
export const mergeProfile = (local: Profile, remote: Profile | null, account: AccountDetails, nowIso: string): ProfileMerge => {
    let next: Profile;
    let shouldPush: boolean;
    if (!remote) {
        next = local;
        shouldPush = true;
    } else if (remote.updatedAt > local.updatedAt) {
        next = remote;
        shouldPush = false;
    } else {
        next = local;
        shouldPush = local.updatedAt > remote.updatedAt;
    }

    if (!next.updatedAt) {
        const filled: Profile = {
            ...next,
            username: next.username || account.username || "",
            name: next.name || account.name || "",
            avatarUrl: next.avatarUrl ?? account.avatarUrl ?? null,
        };
        if (!isSame(filled, next)) {
            next = {...filled, updatedAt: nowIso};
            shouldPush = true;
        }
    }
    return {profile: next, shouldPush, changed: !isSame(next, local)};
};

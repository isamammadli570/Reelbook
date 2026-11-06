import {getLibrary, replaceLibrary} from "@/api/library.api";
import {getLists, replaceLists} from "@/api/lists.api";
import {EMPTY_PROFILE, getProfile, saveProfile} from "@/api/profile.api";
import {
    pullRemoteLibrary,
    pullRemoteLists,
    pullRemoteProfile,
    pushLibraryEntries,
    pushRemoteLists,
    pushRemoteProfile,
} from "@/api/sync.api";
import {createLibrary} from "@/helpers/library";
import {createListsStore} from "@/helpers/lists";
import {mergeLibrary, mergeVersioned} from "@/helpers/sync";

/**
 * Merges the device's library with the server's copy. Returns `true` when the device's library changed,
 * so callers refresh what is on screen only then.
 */
export const syncLibrary = async (userId: string): Promise<boolean> => {
    const local = await getLibrary();
    const remote = await pullRemoteLibrary(userId);
    const {library, outbox} = mergeLibrary(local, remote);

    const changed = JSON.stringify(library) !== JSON.stringify(local);
    if (changed) await replaceLibrary(library);
    await pushLibraryEntries(userId, outbox);
    return changed;
};

/** The same merge for the user's lists. Returns `true` when the device's lists changed. */
export const syncLists = async (userId: string): Promise<boolean> => {
    const local = await getLists();
    const remote = await pullRemoteLists(userId);
    const {values, removed, outbox} = mergeVersioned(local.lists, local.removed ?? {}, remote);
    const merged = {lists: values, removed};

    const changed = JSON.stringify(merged) !== JSON.stringify(local);
    if (changed) await replaceLists(merged);
    await pushRemoteLists(userId, outbox);
    return changed;
};

/**
 * On sign-in: a device with an empty profile takes the server's; otherwise the device's profile is uploaded.
 * A username chosen at sign-up travels in the account metadata until the first profile upload.
 */
export const syncProfileOnSignIn = async (userId: string, signUpUsername: string | null): Promise<boolean> => {
    const local = await getProfile();
    const remote = await pullRemoteProfile(userId);

    const isLocalEmpty = !local.name && !local.bio && !local.username;
    if (remote && isLocalEmpty) {
        await saveProfile(remote);
        return true;
    }

    const username = local.username || remote?.username || signUpUsername || "";
    // A photo set on another device carries over to one that has none yet.
    const next = await saveProfile({...local, username, avatarUrl: local.avatarUrl ?? remote?.avatarUrl ?? null});
    await pushRemoteProfile(userId, next);
    return next.username !== local.username;
};

export const pushProfileChange = async (userId: string): Promise<void> => {
    await pushRemoteProfile(userId, await getProfile());
};

/**
 * Uploads anything not yet synced, then empties this device, so the next person to sign in here
 * does not see the previous account. Throws if the upload fails, and then nothing is removed.
 */
export const flushAndClearDevice = async (userId: string): Promise<void> => {
    await syncLibrary(userId);
    await syncLists(userId);
    await pushProfileChange(userId);
    await replaceLibrary(createLibrary());
    await replaceLists(createListsStore());
    await saveProfile(EMPTY_PROFILE);
};

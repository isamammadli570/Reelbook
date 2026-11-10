import {getLibrary, replaceLibrary, type LibraryItem} from "@/api/library.api";
import {getLists, replaceLists} from "@/api/lists.api";
import {getCurrentSession, signOut} from "@/api/auth.api";
import {EMPTY_PROFILE, getProfile, saveProfile} from "@/api/profile.api";
import {createExclusiveQueue} from "@/lib/exclusive";
import {mergeProfile, type AccountDetails} from "@/helpers/profileSync";
import {
    pullRemoteLibraryEntries,
    pullRemoteLibraryVersions,
    pullRemoteLists,
    pullRemoteProfile,
    pushLibraryEntries,
    pushRemoteLists,
    pushRemoteProfile,
} from "@/api/sync.api";
import {createLibrary} from "@/helpers/library";
import {createListsStore} from "@/helpers/lists";
import {mergeLibrary, mergeVersioned, staleKeys, type RemoteEntry} from "@/helpers/sync";
import {clearRecentSearches} from "@/lib/recentSearches";
import {storage} from "@/lib/storage";
import {publishActivity, publishAllActivity, unpublishActivity} from "@/api/social.api";
import {STORAGE_KEYS} from "@/constants/other";

/**
 * Every sync, profile upload and sign-out runs through this one queue. Signing out used to run beside it, so a
 * sync still waiting on the network could write the old account's library or profile back after the device
 * had been emptied. Tasks queued here must not queue another task and wait for it: that would wait forever.
 */
export const runExclusive = createExclusiveQueue();

/**
 * A task queued for one account can run after that account has signed out (a pause before uploading, coming
 * back to the app). It then must not touch this device, which may already belong to a guest or someone else.
 */
const isSignedInAs = async (userId: string): Promise<boolean> =>
    (await getCurrentSession().catch(() => null))?.user.id === userId;

/**
 * Merges the device's library with the server's copy. Returns `true` when the device's library changed,
 * so callers refresh what is on screen only then.
 * It runs after every edit, so it first asks only when each title last changed, then downloads just the titles
 * newer on the server: a star given in a library of a thousand films moves a few kilobytes, not all of them.
 */
export const syncLibrary = async (userId: string): Promise<boolean> => {
    if (!(await isSignedInAs(userId))) return false;
    const local = await getLibrary();
    const versions = await pullRemoteLibraryVersions(userId);
    const fetched = await pullRemoteLibraryEntries(userId, staleKeys(local.items, local.removed ?? {}, versions));
    // A title not downloaded is not newer on the server, so the device's copy wins and this value is never read.
    const remote: Record<string, RemoteEntry> = Object.fromEntries(
        Object.entries(versions).map(([key, updatedAt]) => [key, fetched[key] ?? {updatedAt, item: null}]),
    );
    const {library, outbox, changed} = mergeLibrary(local, remote);

    if (changed) await replaceLibrary(library);
    await pushLibraryEntries(userId, outbox);
    await shareChanges(userId, Object.fromEntries(Object.entries(outbox).map(([key, entry]) => [key, entry.item])));
    return changed;
};

/* ------------------------------- activity ------------------------------ */

const publishedKey = (userId: string) => `${STORAGE_KEYS.ACTIVITY_PUBLISHED}${userId}`;

/**
 * Friends see what changed. Sharing is a side matter: if it fails (offline, or before the social tables
 * exist) the library sync still counts as done, and the whole library is published again next time instead.
 */
const shareChanges = async (userId: string, changed: Record<string, LibraryItem | null>): Promise<void> => {
    if (!Object.keys(changed).length || !(await getProfile()).shareActivity) return;
    try {
        await publishActivity(userId, changed);
    } catch (error) {
        if (__DEV__) console.warn("[activity]", error);
        await storage.remove(publishedKey(userId));
    }
};

/** Publishes the whole library once per account and device, so friends see the history from before sharing existed. */
export const ensureActivityPublished = async (userId: string): Promise<void> => {
    if (!(await isSignedInAs(userId))) return;
    if (!(await getProfile()).shareActivity || (await storage.get<boolean>(publishedKey(userId)))) return;
    try {
        await publishAllActivity(userId, await getLibrary());
        await storage.set(publishedKey(userId), true);
    } catch (error) {
        if (__DEV__) console.warn("[activity]", error);
    }
};

/** Turning sharing on publishes everything; turning it off takes everything down. */
export const applyActivitySharing = (userId: string, share: boolean): Promise<void> => runExclusive(async () => {
    if (!(await isSignedInAs(userId))) return;
    if (share) {
        await publishAllActivity(userId, await getLibrary());
        await storage.set(publishedKey(userId), true);
    } else {
        await unpublishActivity(userId);
        await storage.remove(publishedKey(userId));
    }
});

/** The same merge for the user's lists. Returns `true` when the device's lists changed. */
export const syncLists = async (userId: string): Promise<boolean> => {
    if (!(await isSignedInAs(userId))) return false;
    const local = await getLists();
    const remote = await pullRemoteLists(userId);
    const {values, removed, outbox, changed} = mergeVersioned(local.lists, local.removed ?? {}, remote);
    if (changed) await replaceLists({lists: values, removed});
    await pushRemoteLists(userId, outbox);
    return changed;
};

/**
 * Brings the profile in step with the server: whichever side holds the newer edit wins (see `mergeProfile`).
 * Runs on sign-in and whenever the app comes back to the front. Returns `true` when this device's profile changed.
 */
export const syncProfile = async (userId: string, account: AccountDetails = {username: null, name: null, avatarUrl: null}): Promise<boolean> => {
    if (!(await isSignedInAs(userId))) return false;
    const local = await getProfile();
    const remote = await pullRemoteProfile(userId);
    const {profile, shouldPush, changed} = mergeProfile(local, remote, account, new Date().toISOString());
    if (changed) await saveProfile(profile);
    if (shouldPush) await pushRemoteProfile(userId, profile);
    return changed;
};

/**
 * Sends a profile edit right away when signed in; a failure is left for the next sync to retry. Queued, so it
 * never reads the profile after a sign-out has emptied it and uploads that blank profile to the old account.
 */
export const pushProfileNow = (): Promise<void> => runExclusive(async () => {
    const session = await getCurrentSession().catch(() => null);
    if (!session) return;
    await pushRemoteProfile(session.user.id, await getProfile()).catch(() => undefined);
});

/**
 * Uploads anything not yet synced, empties this device, then signs out, so the next person to sign in here
 * does not see the previous account. Throws if the upload fails, and then nothing is removed and the
 * account stays signed in. It waits its turn behind any sync already running.
 */
export const signOutAndClearDevice = (): Promise<void> => runExclusive(async () => {
    const session = await getCurrentSession();
    if (session) {
        const userId = session.user.id;
        await syncLibrary(userId);
        await syncLists(userId);
        await syncProfile(userId);
    }
    await clearDevice();
    await signOut();
});

/** Empties the library, lists, profile and recent searches kept on this device; device preferences such as language stay. */
export const clearDevice = async (): Promise<void> => {
    clearRecentSearches();
    await replaceLibrary(createLibrary());
    await replaceLists(createListsStore());
    await saveProfile(EMPTY_PROFILE);
};

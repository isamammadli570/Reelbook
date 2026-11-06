import {supabase} from "@/lib/supabase";
import type {LibraryItem} from "@/api/library.api";
import type {Profile} from "@/api/profile.api";
import type {RemoteEntry, Versioned} from "@/helpers/sync";
import type {UserList} from "@/api/lists.api";
import {DEFAULT_AVATAR_COLOR} from "@/constants/other";

type LibraryRow = {item_key: string; data: LibraryItem | {deleted: true}; updated_at: string};

const client = () => {
    if (!supabase) throw new Error("Supabase is not configured");
    return supabase;
};

const isDeletion = (data: LibraryItem | {deleted: true}): data is {deleted: true} => "deleted" in data && data.deleted === true;

/** Postgres returns timestamps as `...+00:00`; normalising keeps string comparison with the app's `...Z` values valid. */
const normalise = (value: string): string => new Date(value).toISOString();

/** Just when each title last changed on the server: a few bytes a row, so syncing stays light for big libraries. */
export const pullRemoteLibraryVersions = async (userId: string): Promise<Record<string, string>> => {
    const {data, error} = await client().from("library_items").select("item_key, updated_at").eq("user_id", userId);
    if (error) throw error;
    return Object.fromEntries((data as Pick<LibraryRow, "item_key" | "updated_at">[]).map((row) => [row.item_key, normalise(row.updated_at)]));
};

/** Keys per request: keeps the address of the "in" filter well under URL length limits. */
const KEYS_PER_REQUEST = 100;

/** The full entries for the given titles only, asked in batches. */
export const pullRemoteLibraryEntries = async (userId: string, keys: string[]): Promise<Record<string, RemoteEntry>> => {
    const entries: Record<string, RemoteEntry> = {};
    for (let start = 0; start < keys.length; start += KEYS_PER_REQUEST) {
        const batch = keys.slice(start, start + KEYS_PER_REQUEST);
        const {data, error} = await client().from("library_items").select("item_key, data, updated_at").eq("user_id", userId).in("item_key", batch);
        if (error) throw error;
        (data as LibraryRow[]).forEach((row) => {
            entries[row.item_key] = {updatedAt: normalise(row.updated_at), item: isDeletion(row.data) ? null : row.data};
        });
    }
    return entries;
};

/** Writes only the entries that changed on this device; deletions are stored as tombstones so other devices see them. */
export const pushLibraryEntries = async (userId: string, entries: Record<string, RemoteEntry>): Promise<void> => {
    const rows = Object.entries(entries).map(([key, entry]) => ({
        user_id: userId,
        item_key: key,
        data: entry.item ?? {deleted: true},
        updated_at: entry.updatedAt,
    }));
    if (!rows.length) return;

    const {error} = await client().from("library_items").upsert(rows, {onConflict: "user_id,item_key"});
    if (error) throw error;
};

type ListRow = {list_id: string; data: UserList | {deleted: true}; updated_at: string};

const isDeletedList = (data: UserList | {deleted: true}): data is {deleted: true} => "deleted" in data && data.deleted === true;

export const pullRemoteLists = async (userId: string): Promise<Record<string, Versioned<UserList>>> => {
    const {data, error} = await client().from("user_lists").select("list_id, data, updated_at").eq("user_id", userId);
    if (error) throw error;

    return Object.fromEntries(
        (data as ListRow[]).map((row) => [
            row.list_id,
            {updatedAt: normalise(row.updated_at), value: isDeletedList(row.data) ? null : row.data},
        ]),
    );
};

/** Writes only the lists that changed on this device; deleted lists are kept as tombstones. */
export const pushRemoteLists = async (userId: string, entries: Record<string, Versioned<UserList>>): Promise<void> => {
    const rows = Object.entries(entries).map(([id, entry]) => ({
        user_id: userId,
        list_id: id,
        data: entry.value ?? {deleted: true},
        updated_at: entry.updatedAt,
    }));
    if (!rows.length) return;

    const {error} = await client().from("user_lists").upsert(rows, {onConflict: "user_id,list_id"});
    if (error) throw error;
};

type ProfileRow = {name: string; bio: string; username: string | null; cover_path: string | null; cover_url: string | null; avatar_color: string | null; avatar_url: string | null; share_activity?: boolean | null};

/** Before the social migration runs, `share_activity` does not exist; profiles then sync without it. */
const isMissingShareColumn = (error: {message?: string} | null): boolean => Boolean(error?.message?.includes("share_activity"));
const PROFILE_COLUMNS = "name, bio, username, cover_path, cover_url, avatar_color, avatar_url";

export const pullRemoteProfile = async (userId: string): Promise<Profile | null> => {
    const ask = (columns: string) => client().from("profiles").select(columns).eq("user_id", userId).maybeSingle<ProfileRow>();
    let {data, error} = await ask(`${PROFILE_COLUMNS}, share_activity`);
    if (isMissingShareColumn(error)) ({data, error} = await ask(PROFILE_COLUMNS));
    if (error) throw error;
    if (!data) return null;
    return {
        name: data.name,
        bio: data.bio,
        username: data.username ?? "",
        coverPath: data.cover_path,
        coverUrl: data.cover_url,
        avatarColor: data.avatar_color ?? DEFAULT_AVATAR_COLOR,
        avatarUrl: data.avatar_url,
        shareActivity: data.share_activity ?? true,
    };
};

export const pushRemoteProfile = async (userId: string, profile: Profile): Promise<void> => {
    const row = {
        user_id: userId,
        name: profile.name,
        bio: profile.bio,
        // An empty handle is stored as null so the unique index ignores it.
        username: profile.username || null,
        cover_path: profile.coverPath,
        cover_url: profile.coverUrl,
        avatar_color: profile.avatarColor,
        avatar_url: profile.avatarUrl,
        updated_at: new Date().toISOString(),
    };
    let {error} = await client().from("profiles").upsert({...row, share_activity: profile.shareActivity}, {onConflict: "user_id"});
    if (isMissingShareColumn(error)) ({error} = await client().from("profiles").upsert(row, {onConflict: "user_id"}));
    if (error) throw error;
};

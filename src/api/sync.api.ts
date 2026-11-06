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

export const pullRemoteLibrary = async (userId: string): Promise<Record<string, RemoteEntry>> => {
    const {data, error} = await client().from("library_items").select("item_key, data, updated_at").eq("user_id", userId);
    if (error) throw error;

    return Object.fromEntries(
        (data as LibraryRow[]).map((row) => [
            row.item_key,
            {updatedAt: normalise(row.updated_at), item: isDeletion(row.data) ? null : row.data},
        ]),
    );
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

type ProfileRow ={name: string; bio: string; username: string | null; cover_path: string | null; avatar_color: string | null; avatar_url: string | null};

export const pullRemoteProfile = async (userId: string): Promise<Profile | null> => {
    const {data, error} = await client()
        .from("profiles")
        .select("name, bio, username, cover_path, avatar_color, avatar_url")
        .eq("user_id", userId)
        .maybeSingle<ProfileRow>();
    if (error) throw error;
    if (!data) return null;
    return {
        name: data.name,
        bio: data.bio,
        username: data.username ?? "",
        coverPath: data.cover_path,
        avatarColor: data.avatar_color ?? DEFAULT_AVATAR_COLOR,
        avatarUrl: data.avatar_url,
    };
};

export const pushRemoteProfile = async (userId: string, profile: Profile): Promise<void> => {
    const {error} = await client()
        .from("profiles")
        .upsert(
            {
                user_id: userId,
                name: profile.name,
                bio: profile.bio,
                // An empty handle is stored as null so the unique index ignores it.
                username: profile.username || null,
                cover_path: profile.coverPath,
                avatar_color: profile.avatarColor,
                avatar_url: profile.avatarUrl,
                updated_at: new Date().toISOString(),
            },
            {onConflict: "user_id"},
        );
    if (error) throw error;
};

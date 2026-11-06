import {supabase} from "@/lib/supabase";
import type {Library, LibraryItem} from "@/api/library.api";
import {eventsOf, type ActivityEvent, type ActivityKind} from "@/helpers/social";
import {DEFAULT_AVATAR_COLOR, type MediaType} from "@/constants/other";

const client = () => {
    if (!supabase) throw new Error("Supabase is not configured");
    return supabase;
};

/* ------------------------------ profiles ------------------------------ */

/** Another person as the app shows them: never their email, which stays private to Supabase. */
export type PublicProfile = {
    userId: string;
    username: string;
    name: string;
    bio: string;
    avatarUrl: string | null;
    avatarColor: string;
    coverUrl: string | null;
    coverPath: string | null;
    shareActivity: boolean;
};

type ProfileRow = {
    user_id: string;
    username: string | null;
    name: string;
    bio: string;
    avatar_url: string | null;
    avatar_color: string | null;
    cover_url: string | null;
    cover_path: string | null;
    share_activity: boolean | null;
};

const PROFILE_COLUMNS = "user_id, username, name, bio, avatar_url, avatar_color, cover_url, cover_path, share_activity";

const toProfile = (row: ProfileRow): PublicProfile => ({
    userId: row.user_id,
    username: row.username ?? "",
    name: row.name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    avatarColor: row.avatar_color ?? DEFAULT_AVATAR_COLOR,
    coverUrl: row.cover_url,
    coverPath: row.cover_path,
    shareActivity: row.share_activity ?? true,
});

/** People whose @username starts with the text, or whose name contains it; only those who chose a handle. */
export const searchUsers = async (query: string, selfId: string | null): Promise<PublicProfile[]> => {
    let request = client()
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .or(`username.ilike.${query.toLowerCase()}%,name.ilike.%${query}%`)
        .not("username", "is", null)
        .limit(20);
    if (selfId) request = request.neq("user_id", selfId);
    const {data, error} = await request;
    if (error) throw error;
    return (data as ProfileRow[]).map(toProfile);
};

/** One person by their handle, which is stored in lower case; `null` when nobody has it. */
export const getUserByUsername = async (username: string): Promise<PublicProfile | null> => {
    const {data, error} = await client().from("profiles").select(PROFILE_COLUMNS).eq("username", username.toLowerCase()).maybeSingle<ProfileRow>();
    if (error) throw error;
    return data ? toProfile(data) : null;
};

const profilesByIds = async (ids: string[]): Promise<Map<string, PublicProfile>> => {
    if (!ids.length) return new Map();
    const {data, error} = await client().from("profiles").select(PROFILE_COLUMNS).in("user_id", ids);
    if (error) throw error;
    return new Map((data as ProfileRow[]).map((row) => [row.user_id, toProfile(row)]));
};

/* ------------------------------- follows ------------------------------- */

export type FollowCounts = {followers: number; following: number};

export const getFollowCounts = async (userId: string): Promise<FollowCounts> => {
    const count = async (column: "follower_id" | "followee_id") => {
        const {count: total, error} = await client().from("follows").select("*", {count: "exact", head: true}).eq(column, userId);
        if (error) throw error;
        return total ?? 0;
    };
    const [followers, following] = await Promise.all([count("followee_id"), count("follower_id")]);
    return {followers, following};
};

/** The ids of everyone this person follows. */
export const getFollowingIds = async (userId: string): Promise<string[]> => {
    const {data, error} = await client().from("follows").select("followee_id").eq("follower_id", userId).order("created_at", {ascending: false});
    if (error) throw error;
    return (data as {followee_id: string}[]).map((row) => row.followee_id);
};

const getFollowerIds = async (userId: string): Promise<string[]> => {
    const {data, error} = await client().from("follows").select("follower_id").eq("followee_id", userId).order("created_at", {ascending: false});
    if (error) throw error;
    return (data as {follower_id: string}[]).map((row) => row.follower_id);
};

/** The people someone follows, or who follow them, newest first. */
export const getFollowList = async (userId: string, direction: "following" | "followers"): Promise<PublicProfile[]> => {
    const ids = direction === "following" ? await getFollowingIds(userId) : await getFollowerIds(userId);
    const profiles = await profilesByIds(ids);
    return ids.flatMap((id) => profiles.get(id) ?? []);
};

export const isFollowing = async (selfId: string, userId: string): Promise<boolean> => {
    const {count, error} = await client().from("follows").select("*", {count: "exact", head: true}).eq("follower_id", selfId).eq("followee_id", userId);
    if (error) throw error;
    return (count ?? 0) > 0;
};

export const setFollowing = async (selfId: string, userId: string, follow: boolean): Promise<void> => {
    const follows = client().from("follows");
    const {error} = follow
        ? await follows.upsert({follower_id: selfId, followee_id: userId}, {onConflict: "follower_id,followee_id", ignoreDuplicates: true})
        : await follows.delete().eq("follower_id", selfId).eq("followee_id", userId);
    if (error) throw error;
};

/* ------------------------------- activity ------------------------------ */

type ActivityRow = {
    user_id: string;
    event_key: string;
    item_key: string;
    kind: ActivityKind;
    media_type: MediaType;
    media_id: number;
    title: string;
    poster_path: string | null;
    year: string | null;
    rating: number | string | null;
    review: string | null;
    episode_count: number | null;
    happened_at: string;
};

const toRow = (userId: string, event: ActivityEvent): ActivityRow => ({
    user_id: userId,
    event_key: event.eventKey,
    item_key: event.itemKey,
    kind: event.kind,
    media_type: event.mediaType,
    media_id: event.mediaId,
    title: event.title,
    poster_path: event.posterPath,
    year: event.year,
    rating: event.rating,
    review: event.review,
    episode_count: event.episodeCount,
    happened_at: event.happenedAt,
});

/** A feed entry: the event and who did it. */
export type FeedEvent = ActivityEvent & {userId: string; author: PublicProfile | null};

const fromRow = (row: ActivityRow, author: PublicProfile | null): FeedEvent => ({
    userId: row.user_id,
    author,
    eventKey: row.event_key,
    itemKey: row.item_key,
    kind: row.kind,
    mediaType: row.media_type,
    mediaId: row.media_id,
    title: row.title,
    posterPath: row.poster_path,
    year: row.year ?? "",
    // Postgres numerics can arrive as text.
    rating: row.rating === null ? null : Number(row.rating),
    review: row.review,
    episodeCount: row.episode_count,
    happenedAt: row.happened_at,
});

/** Rows per write: big imports go up in a few requests rather than one huge one. */
const ROWS_PER_WRITE = 500;
/** Titles per clean-up request, keeping the address of the filter short. */
const ITEMS_PER_DELETE = 40;

const insertEvents = async (userId: string, events: ActivityEvent[]): Promise<void> => {
    for (let start = 0; start < events.length; start += ROWS_PER_WRITE) {
        const rows = events.slice(start, start + ROWS_PER_WRITE).map((event) => toRow(userId, event));
        const {error} = await client().from("activity").upsert(rows, {onConflict: "user_id,event_key"});
        if (error) throw error;
    }
};

/**
 * Brings the shared activity of the given titles up to date: their current events are written, and events
 * that no longer exist (a deleted viewing or review, a title removed) are taken down. `null` is a removed title.
 */
export const publishActivity = async (userId: string, changed: Record<string, LibraryItem | null>): Promise<void> => {
    const keys = Object.keys(changed);
    if (!keys.length) return;
    const events = Object.values(changed).flatMap((item) => (item ? eventsOf(item) : []));
    await insertEvents(userId, events);

    for (let start = 0; start < keys.length; start += ITEMS_PER_DELETE) {
        const batch = keys.slice(start, start + ITEMS_PER_DELETE);
        const keep = events.filter((event) => batch.includes(event.itemKey)).map((event) => `"${event.eventKey}"`);
        let request = client().from("activity").delete().eq("user_id", userId).in("item_key", batch);
        if (keep.length) request = request.not("event_key", "in", `(${keep.join(",")})`);
        const {error} = await request;
        if (error) throw error;
    }
};

/** Takes down everything this person shared, as when they stop sharing. */
export const unpublishActivity = async (userId: string): Promise<void> => {
    const {error} = await client().from("activity").delete().eq("user_id", userId);
    if (error) throw error;
};

/** Publishes the whole library from scratch: the first time, or when sharing is turned back on. */
export const publishAllActivity = async (userId: string, library: Library): Promise<void> => {
    await unpublishActivity(userId);
    await insertEvents(userId, Object.values(library.items).flatMap(eventsOf));
};

export const FEED_PAGE_SIZE = 20;

const withAuthors = async (rows: ActivityRow[]): Promise<FeedEvent[]> => {
    const authors = await profilesByIds([...new Set(rows.map((row) => row.user_id))]);
    return rows.map((row) => fromRow(row, authors.get(row.user_id) ?? null));
};

/** One page of what the people someone follows did, newest first. */
export const getFeedPage = async (selfId: string, page: number): Promise<FeedEvent[]> => {
    const ids = await getFollowingIds(selfId);
    if (!ids.length) return [];
    const from = page * FEED_PAGE_SIZE;
    const {data, error} = await client().from("activity").select("*").in("user_id", ids).order("happened_at", {ascending: false}).range(from, from + FEED_PAGE_SIZE - 1);
    if (error) throw error;
    return withAuthors(data as ActivityRow[]);
};

/** One page of a single person's activity, for their profile. */
export const getUserActivityPage = async (userId: string, page: number): Promise<FeedEvent[]> => {
    const from = page * FEED_PAGE_SIZE;
    const {data, error} = await client().from("activity").select("*").eq("user_id", userId).order("happened_at", {ascending: false}).range(from, from + FEED_PAGE_SIZE - 1);
    if (error) throw error;
    return withAuthors(data as ActivityRow[]);
};

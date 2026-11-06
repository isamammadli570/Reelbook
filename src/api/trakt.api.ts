import {supabase} from "@/lib/supabase";
import {getSnapshot} from "@/api/importSnapshots.api";
import {mergeIntoLibrary} from "@/api/library.api";
import {mergeIntoLists} from "@/api/lists.api";
import {
    mergeTrakt,
    mergeTraktLists,
    type TraktExport,
    type TraktHistoryMovie,
    type TraktImportList,
    type TraktList,
    type TraktListEntry,
    type TraktMatch,
    type TraktRating,
    type TraktTitle,
    type TraktWatchedShow,
    type TraktWatchlistEntry,
} from "@/helpers/trakt";

/** Why talking to Trakt stopped: the server function is missing or unset, Trakt said no, or the network failed. */
export type TraktErrorKind = "not_configured" | "unavailable" | "failed";

export class TraktError extends Error {
    readonly kind: TraktErrorKind;
    constructor(kind: TraktErrorKind) {
        super(`trakt: ${kind}`);
        this.kind = kind;
    }
}

type FunctionReply<T> = {status: number; data?: T; error?: string; pageCount?: number; verifier?: string};

/**
 * Everything goes through the "trakt" Edge Function: browsers cannot call Trakt directly, and the app's Trakt
 * credentials stay on the server. It always answers 200,
 * with Trakt's own status inside, so "not approved yet" is not mistaken for a failure.
 */
const call = async <T>(body: Record<string, unknown>): Promise<FunctionReply<T>> => {
    if (!supabase) throw new TraktError("not_configured");
    const {data, error} = await supabase.functions.invoke<FunctionReply<T>>("trakt", {body});
    // A function that is not deployed answers 404; supabase-js keeps that response on the error's `context`.
    if (error || !data) {
        const status = (error as {context?: {status?: number}} | null)?.context?.status;
        throw new TraktError(status === 404 ? "not_configured" : "unavailable");
    }
    if (data.error === "not_configured") throw new TraktError("not_configured");
    return data;
};

/* ------------------------------- sign-in ------------------------------- */

/** `verifier` is the PKCE secret of this one sign-in; it goes back with every poll and is forgotten after. */
export type DeviceCode = {deviceCode: string; userCode: string; verificationUrl: string; expiresIn: number; interval: number; verifier: string | null};

type DeviceCodeReply = {device_code: string; user_code: string; verification_url: string; expires_in: number; interval: number};

/** A short code for the person to enter at trakt.tv/activate, and how often to ask whether they did. */
export const requestDeviceCode = async (): Promise<DeviceCode> => {
    const reply = await call<DeviceCodeReply>({action: "device_code"});
    if (reply.status !== 200 || !reply.data) throw new TraktError("unavailable");
    const {device_code, user_code, verification_url, expires_in, interval} = reply.data;
    return {deviceCode: device_code, userCode: user_code, verificationUrl: verification_url, expiresIn: expires_in, interval, verifier: reply.verifier ?? null};
};

export type PollResult = {state: "approved"; token: string} | {state: "pending" | "slow_down" | "denied" | "expired" | "invalid"};

/** Asks once whether the code was approved; Trakt's statuses, as its device sign-in describes them. */
export const pollDeviceToken = async (deviceCode: string, verifier: string | null): Promise<PollResult> => {
    const reply = await call<{access_token?: string}>({action: "poll", deviceCode, verifier});
    switch (reply.status) {
        case 200:
            return reply.data?.access_token ? {state: "approved", token: reply.data.access_token} : {state: "invalid"};
        case 400:
            return {state: "pending"};
        case 429:
            return {state: "slow_down"};
        case 410:
            return {state: "expired"};
        case 418:
            return {state: "denied"};
        default:
            return {state: "invalid"};
    }
};

/** Ends the token once the import is over; a failure here changes nothing for the person. */
export const revokeToken = async (token: string): Promise<void> => {
    await call({action: "revoke", token}).catch(() => undefined);
};

/* --------------------------------- data -------------------------------- */

const get = async <T>(token: string, path: string, page?: number): Promise<{data: T; pageCount: number}> => {
    const reply = await call<T>({action: "get", token, path, page});
    if (reply.status !== 200 || reply.data === undefined) throw new TraktError("failed");
    return {data: reply.data, pageCount: reply.pageCount ?? 1};
};

/** A list Trakt pages through, read to the end. */
const getAllPages = async <T>(token: string, path: string): Promise<T[]> => {
    const first = await get<T[]>(token, path, 1);
    const pages = [first.data];
    for (let page = 2; page <= first.pageCount; page++) pages.push((await get<T[]>(token, path, page)).data);
    return pages.flat();
};

export type TraktStep = "history" | "shows" | "ratings" | "watchlist" | "lists";

/** Reads everything the import needs, reporting which part it is on. */
export const fetchTraktExport = async (token: string, onStep: (step: TraktStep) => void): Promise<TraktExport> => {
    onStep("history");
    const history = await getAllPages<TraktHistoryMovie>(token, "/sync/history/movies");
    onStep("shows");
    const watchedShows = (await get<TraktWatchedShow[]>(token, "/sync/watched/shows")).data;
    onStep("ratings");
    const ratings = [
        ...(await get<TraktRating[]>(token, "/sync/ratings/movies")).data,
        ...(await get<TraktRating[]>(token, "/sync/ratings/shows")).data,
    ];
    onStep("watchlist");
    const watchlist = [
        ...(await get<TraktWatchlistEntry[]>(token, "/sync/watchlist/movies")).data,
        ...(await get<TraktWatchlistEntry[]>(token, "/sync/watchlist/shows")).data,
    ];
    onStep("lists");
    const lists = await Promise.all(
        (await get<TraktList[]>(token, "/users/me/lists")).data.map(async (list) => ({
            list,
            items: (await get<TraktListEntry[]>(token, `/users/me/lists/${list.ids.trakt}/items/movie,show`)).data,
        })),
    );
    return {history, watchedShows, ratings, watchlist, lists};
};

/** Requests at once, quick for a big history while staying under TMDB's rate limit. */
const CONCURRENCY = 6;

export type TraktMatchResult = {matched: TraktMatch[]; failed: TraktTitle[]};

/** Fetches each title's details from TMDB by the id Trakt gave, a few at a time; one failing never stops the rest. */
export const matchTraktTitles = async (titles: TraktTitle[], onProgress: (done: number) => void, signal?: {isCancelled: boolean}): Promise<TraktMatchResult> => {
    const matched: TraktMatch[] = [];
    const failed: TraktTitle[] = [];
    let next = 0;
    let done = 0;
    const worker = async () => {
        while (next < titles.length && !signal?.isCancelled) {
            const title = titles[next++];
            try {
                matched.push({title, snapshot: await getSnapshot(title.mediaType, title.tmdbId)});
            } catch {
                failed.push(title);
            }
            onProgress(++done);
        }
    };
    await Promise.all(Array.from({length: Math.min(CONCURRENCY, titles.length)}, worker));
    return {matched, failed};
};

/** Writes the found titles into the library and the lists into the person's lists; sync carries both to the account. */
export const importTraktMatches = async (matches: TraktMatch[], lists: TraktImportList[]): Promise<void> => {
    const now = new Date();
    await mergeIntoLibrary((library) => mergeTrakt(library, matches, now));
    if (lists.length) {
        const snapshots = new Map(matches.map(({title, snapshot}) => [title.key, snapshot]));
        await mergeIntoLists((store) => mergeTraktLists(store, lists, snapshots, now.toISOString()));
    }
};

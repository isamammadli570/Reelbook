import type {DiaryEntry, Library, LibraryItem, MediaSnapshot} from "@/api/library.api";
import type {ListsStore} from "@/api/lists.api";
import {toIsoDay} from "@/helpers/calendar";
import {parseDate} from "@/helpers/dates";
import {mergeLetterboxdLists} from "@/helpers/letterboxd";
import {createId, itemKey, updateItem} from "@/helpers/library";
import {MEDIA_TYPE, type MediaType} from "@/constants/other";

/* ------------------------- what Trakt sends back ------------------------- */

type TraktIds = {trakt?: number; slug?: string; imdb?: string | null; tmdb?: number | null};
export type TraktTitleRef = {title: string; year: number | null; ids: TraktIds};

export type TraktHistoryMovie = {watched_at: string; movie: TraktTitleRef};
export type TraktWatchedShow = {
    show: TraktTitleRef;
    seasons?: {number: number; episodes: {number: number; last_watched_at: string | null}[]}[];
};
export type TraktRating = {rated_at: string; rating: number; type: "movie" | "show"; movie?: TraktTitleRef; show?: TraktTitleRef};
export type TraktWatchlistEntry = {listed_at: string; type: "movie" | "show"; movie?: TraktTitleRef; show?: TraktTitleRef};
export type TraktList = {name: string; description: string | null; ids: {trakt: number; slug: string}};
export type TraktListEntry = {rank: number; type: "movie" | "show"; movie?: TraktTitleRef; show?: TraktTitleRef};

/** Everything the import reads from one Trakt account. */
export type TraktExport = {
    history: TraktHistoryMovie[];
    watchedShows: TraktWatchedShow[];
    ratings: TraktRating[];
    watchlist: TraktWatchlistEntry[];
    lists: {list: TraktList; items: TraktListEntry[]}[];
};

/* ------------------------------ per title ------------------------------ */

/** Everything a Trakt account says about one movie or series, keyed like the library. */
export type TraktTitle = {
    key: string;
    mediaType: MediaType;
    tmdbId: number;
    title: string;
    year: number | null;
    /** Movies: when each viewing happened, exact to the minute as Trakt keeps it. */
    plays: string[];
    /** Series: `season:episode` → when it was last watched. */
    episodes: Record<string, string>;
    /** 0.5–5, from Trakt's 1–10. */
    rating: number | null;
    isInWatchlist: boolean;
};

export type TraktImportList = {id: string; name: string; description: string; keys: string[]};

export type CollectedTrakt = {
    titles: TraktTitle[];
    lists: TraktImportList[];
    /** Titles Trakt has no TMDB id for, so they cannot be found here. */
    missing: {title: string; year: number | null}[];
};

/** Trakt's 1–10 as this app's half stars; 7 becomes 3.5. */
export const traktRating = (value: number): number | null => {
    const stars = Math.round(value) / 2;
    return stars >= 0.5 && stars <= 5 ? stars : null;
};

/** Sorts Trakt's data by title, using the TMDB id each title carries: no searching by name, so no wrong matches. */
export const collectTrakt = (data: TraktExport): CollectedTrakt => {
    const titles = new Map<string, TraktTitle>();
    const missing = new Map<string, {title: string; year: number | null}>();

    const titleFor = (mediaType: MediaType, ref: TraktTitleRef | undefined): TraktTitle | null => {
        if (!ref) return null;
        const tmdbId = ref.ids.tmdb;
        if (!tmdbId) {
            missing.set(`${ref.title}|${ref.year}`, {title: ref.title, year: ref.year});
            return null;
        }
        const key = itemKey(mediaType, tmdbId);
        const existing = titles.get(key);
        if (existing) return existing;
        const title: TraktTitle = {key, mediaType, tmdbId, title: ref.title, year: ref.year, plays: [], episodes: {}, rating: null, isInWatchlist: false};
        titles.set(key, title);
        return title;
    };
    const mediaTypeOf = (type: "movie" | "show"): MediaType => (type === "movie" ? MEDIA_TYPE.MOVIE : MEDIA_TYPE.TV);
    const refOf = (entry: {type: "movie" | "show"; movie?: TraktTitleRef; show?: TraktTitleRef}) => (entry.type === "movie" ? entry.movie : entry.show);

    data.history.forEach((entry) => titleFor(MEDIA_TYPE.MOVIE, entry.movie)?.plays.push(entry.watched_at));
    data.watchedShows.forEach((entry) => {
        const title = titleFor(MEDIA_TYPE.TV, entry.show);
        if (!title) return;
        // Specials (season 0) stay out, as they do in the app's own progress.
        entry.seasons?.filter((season) => season.number > 0).forEach((season) => season.episodes.forEach((episode) => {
            if (episode.last_watched_at) title.episodes[`${season.number}:${episode.number}`] = episode.last_watched_at;
        }));
    });
    data.ratings.forEach((entry) => {
        const title = titleFor(mediaTypeOf(entry.type), refOf(entry));
        if (title) title.rating = traktRating(entry.rating);
    });
    data.watchlist.forEach((entry) => {
        const title = titleFor(mediaTypeOf(entry.type), refOf(entry));
        if (title) title.isInWatchlist = true;
    });
    const lists = data.lists.map(({list, items}) => ({
        id: `trakt-${list.ids.slug || list.ids.trakt}`,
        name: list.name,
        description: list.description ?? "",
        keys: [...items].sort((a, b) => a.rank - b.rank).flatMap((entry) => titleFor(mediaTypeOf(entry.type), refOf(entry))?.key ?? []),
    }));

    return {titles: [...titles.values()].map((title) => ({...title, plays: [...title.plays].sort().reverse()})), lists, missing: [...missing.values()]};
};

/** Whether Trakt says anything about the title itself, beyond it being in a list. */
export const hasTraktData = (title: TraktTitle): boolean =>
    title.plays.length > 0 || Object.keys(title.episodes).length > 0 || title.rating !== null || title.isInWatchlist;

export type TraktSummary = {films: number; viewings: number; series: number; episodes: number; ratings: number; watchlist: number; lists: number};

export const summarizeTrakt = (titles: TraktTitle[], lists: TraktImportList[], found: Set<string>): TraktSummary => {
    const withData = titles.filter((title) => found.has(title.key) && hasTraktData(title));
    return {
        films: withData.filter((title) => title.mediaType === MEDIA_TYPE.MOVIE && title.plays.length > 0).length,
        viewings: withData.reduce((total, title) => total + title.plays.length, 0),
        series: withData.filter((title) => Object.keys(title.episodes).length > 0).length,
        episodes: withData.reduce((total, title) => total + Object.keys(title.episodes).length, 0),
        ratings: withData.filter((title) => title.rating !== null).length,
        watchlist: withData.filter((title) => title.isInWatchlist).length,
        lists: lists.filter((list) => list.keys.some((key) => found.has(key))).length,
    };
};

/* ------------------------------- merging ------------------------------- */

const dayOf = (iso: string): string => {
    const date = parseDate(iso);
    return date ? toIsoDay(date) : iso.slice(0, 10);
};

/**
 * Adds Trakt's view of a title without taking anything away, as the Letterboxd import does: a viewing on a day
 * already in the diary is skipped, episodes already marked keep their date, and an existing rating stays.
 */
export const mergeTraktTitle = (item: LibraryItem, title: TraktTitle): LibraryItem => {
    const rating = item.rating ?? title.rating;

    if (title.mediaType === MEDIA_TYPE.TV) {
        const episodes = {...title.episodes, ...item.episodes};
        const isWatching = Object.keys(episodes).length > 0;
        return {
            ...item,
            rating,
            episodes,
            isFollowing: item.isFollowing || isWatching,
            isInWatchlist: (item.isInWatchlist || title.isInWatchlist) && !isWatching,
        };
    }

    const known = new Set(item.diary.map((entry) => dayOf(entry.watchedAt)));
    const added: DiaryEntry[] = [];
    title.plays.forEach((watchedAt) => {
        const day = dayOf(watchedAt);
        if (known.has(day)) return;
        known.add(day);
        added.push({id: createId(), watchedAt, rating: null});
    });
    const diary = [...added, ...item.diary].sort((a, b) => b.watchedAt.localeCompare(a.watchedAt));
    // The latest viewing carries the rating when it has none of its own, as rating in the app does.
    const [latest, ...older] = diary;
    const rated = latest && latest.rating === null && rating !== null ? [{...latest, rating}, ...older] : diary;
    return {...item, rating, diary: rated, isInWatchlist: (item.isInWatchlist || title.isInWatchlist) && !rated.length};
};

export type TraktMatch = {title: TraktTitle; snapshot: MediaSnapshot};

/** The library with every found title merged in, in one write; titles known only from a list are left alone. */
export const mergeTrakt = (library: Library, matches: TraktMatch[], now: Date): Library =>
    matches
        .filter(({title}) => hasTraktData(title))
        .reduce((next, {title, snapshot}) => updateItem(next, snapshot, (item) => mergeTraktTitle(item, title), now.toISOString()), library);

/** Trakt lists become the person's own lists, in Trakt's order; importing again updates the same list. */
export const mergeTraktLists = (store: ListsStore, lists: TraktImportList[], snapshots: Map<string, MediaSnapshot>, nowIso: string): ListsStore =>
    // Same rules as Letterboxd lists; there the films are keyed by name and year, here by library key.
    mergeLetterboxdLists(store, lists.map((list) => ({...list, films: list.keys.map((key) => ({key, name: "", year: null}))})), snapshots, nowIso);

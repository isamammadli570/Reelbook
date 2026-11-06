import type {EpisodeRef, Library, LibraryItem, MediaSnapshot, SeriesSnapshot} from "@/api/library.api";
import type {MediaSummary} from "@/api/media.api";
import type {MovieDetails} from "@/api/movies.api";
import type {SeriesDetails} from "@/api/series.api";
import {MEDIA_TYPE, type MediaType} from "@/constants/other";
import {isReleased} from "@/helpers/details";
import {mediaYear} from "@/helpers/media";

export const createLibrary = (): Library => ({items: {}, removed: {}});

export const itemKey = (mediaType: MediaType, id: number): string => `${mediaType}:${id}`;

export const episodeKey = ({season, episode}: EpisodeRef): string => `${season}:${episode}`;

const parseEpisodeKey = (key: string): EpisodeRef => {
    const [season, episode] = key.split(":").map(Number);
    return {season, episode};
};

/* ----------------------------- snapshots ----------------------------- */

export const movieSnapshot = (movie: MovieDetails): MediaSnapshot => ({
    id: movie.id,
    mediaType: MEDIA_TYPE.MOVIE,
    title: movie.title,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    year: mediaYear(movie),
    genres: movie.genres.map((genre) => genre.name),
    runtime: movie.runtime,
    series: null,
});

/** TMDB moves an episode from "next" to "last" with a delay, so a "next" whose air date has passed already counts. */
export const lastAiredEpisode = (series: Pick<SeriesDetails, "last_episode_to_air" | "next_episode_to_air">, today: Date = new Date()): EpisodeRef | null => {
    const next = series.next_episode_to_air;
    const episode = next && isReleased(next.air_date, today) ? next : series.last_episode_to_air;
    return episode ? {season: episode.season_number, episode: episode.episode_number} : null;
};

export const seriesSnapshot =(series: SeriesDetails): MediaSnapshot => ({
    id: series.id,
    mediaType: MEDIA_TYPE.TV,
    title: series.name,
    posterPath: series.poster_path,
    backdropPath: series.backdrop_path,
    year: mediaYear(series),
    genres: series.genres.map((genre) => genre.name),
    runtime: null,
    series: {
        seasons: series.seasons
            .filter((season) => season.season_number > 0)
            .map((season) => ({number: season.season_number, episodeCount: season.episode_count}))
            .sort((a, b) => a.number - b.number),
        lastAired: lastAiredEpisode(series),
        episodeRuntime: series.episode_run_time[0] ?? series.last_episode_to_air?.runtime ?? null,
        network: series.networks[0]?.name ?? null,
    },
});

/* ------------------------------ items ------------------------------- */

const createItem = (snapshot: MediaSnapshot, nowIso: string): LibraryItem => ({
    ...snapshot,
    addedAt: nowIso,
    updatedAt: nowIso,
    isInWatchlist: false,
    isFavorite: false,
    isFollowing: false,
    rating: null,
    diary: [],
    episodes: {},
    review: null,
});

/** An item the user no longer has any relation to is dropped instead of lingering in storage. */
export const isEmptyItem = (item: LibraryItem): boolean =>
    !item.isInWatchlist &&
    !item.isFavorite &&
    !item.isFollowing &&
    item.rating === null &&
    !item.diary.length &&
    !Object.keys(item.episodes).length &&
    !item.review;

/** Trims the text; blank input clears the review rather than saving an empty one. */
export const setReview = (item: LibraryItem, text: string, nowIso: string): LibraryItem => {
    const trimmed = text.trim();
    return {...item, review: trimmed ? {text: trimmed, updatedAt: nowIso} : null};
};

/** Applies `change` to the title's item (creating it when needed), refreshes its snapshot and prunes it if empty. */
export const updateItem = (library: Library, snapshot: MediaSnapshot, change: (item: LibraryItem) => LibraryItem, nowIso: string): Library => {
    const key = itemKey(snapshot.mediaType, snapshot.id);
    const current = library.items[key] ?? createItem(snapshot, nowIso);
    const next = {...change({...current, ...snapshot}), updatedAt: nowIso};

    const items = {...library.items};
    const removed = {...library.removed};
    if (isEmptyItem(next)) {
        delete items[key];
        removed[key] = nowIso;
    } else {
        items[key] = next;
        delete removed[key];
    }
    return {...library, items, removed};
};

/** Updates the stored snapshot of a title only if the user already has it, without touching `updatedAt`. */
export const refreshSnapshot = (library: Library, snapshot: MediaSnapshot): Library => {
    const key = itemKey(snapshot.mediaType, snapshot.id);
    const current = library.items[key];
    if (!current) return library;
    return {...library, items: {...library.items, [key]: {...current, ...snapshot}}};
};

export const toggleWatchlist = (item: LibraryItem): LibraryItem => ({...item, isInWatchlist: !item.isInWatchlist});

export const toggleFavorite = (item: LibraryItem): LibraryItem => ({...item, isFavorite: !item.isFavorite});

export const toggleFollowing = (item: LibraryItem): LibraryItem => ({
    ...item,
    isFollowing: !item.isFollowing,
    // Starting a series takes it off the "to watch" list, like a logged movie would.
    isInWatchlist: item.isFollowing ? item.isInWatchlist : false,
});

export const setRating = (item: LibraryItem, rating: number | null): LibraryItem => ({...item, rating});

/** Star taps: a new star sets that rating, tapping the current one halves it, tapping the half clears it. */
export const nextRating = (current: number | null, tapped: number): number | null => {
    if (current === tapped) return tapped - 0.5;
    if (current === tapped - 0.5) return null;
    return tapped;
};

/** 3.5 → "★★★½", the compact form used in lists. */
export const formatStars = (rating: number): string => "★".repeat(Math.floor(rating)) + (rating % 1 ? "½" : "");

const createId = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const addDiaryEntry = (item: LibraryItem, watchedAt: string): LibraryItem => ({
    ...item,
    isInWatchlist: false,
    diary: [{id: createId(), watchedAt, rating: item.rating}, ...item.diary].sort((a, b) => b.watchedAt.localeCompare(a.watchedAt)),
});

export const removeDiaryEntry = (item: LibraryItem, entryId: string): LibraryItem => ({...item, diary: item.diary.filter((entry) => entry.id !== entryId)});

export const toggleEpisode = (item: LibraryItem, episode: EpisodeRef, nowIso: string): LibraryItem => {
    const key = episodeKey(episode);
    const episodes = {...item.episodes};
    if (episodes[key]) delete episodes[key];
    else episodes[key] = nowIso;
    return {...item, episodes, isFollowing: true, isInWatchlist: false};
};

export const setEpisodesWatched = (item: LibraryItem, season: number, numbers: number[], isWatched: boolean, nowIso: string): LibraryItem => {
    const episodes = {...item.episodes};
    numbers.forEach((episode) => {
        const key = episodeKey({season, episode});
        if (!isWatched) delete episodes[key];
        else episodes[key] ??= nowIso;
    });
    return {...item, episodes, isFollowing: true, isInWatchlist: false};
};

/* --------------------------- series progress -------------------------- */

export const isAired = (series: SeriesSnapshot, {season, episode}: EpisodeRef): boolean => {
    const last = series.lastAired;
    if (!last) return false;
    return season < last.season || (season === last.season && episode <= last.episode);
};

export const airedEpisodeCount = (series: SeriesSnapshot): number =>
    series.seasons.reduce((total, season) => {
        const last = series.lastAired;
        if (!last || season.number > last.season) return total;
        return total + (season.number < last.season ? season.episodeCount : Math.min(last.episode, season.episodeCount));
    }, 0);

export const isEpisodeWatched = (item: LibraryItem | undefined, episode: EpisodeRef): boolean => Boolean(item?.episodes[episodeKey(episode)]);

/** Watched vs aired regular-season episodes; specials and unaired episodes never count. */
export const seriesProgress = (item: LibraryItem): {watched: number; aired: number; percent: number} => {
    const series = item.series;
    if (!series) return {watched: 0, aired: 0, percent: 0};
    const aired = airedEpisodeCount(series);
    const watched = Object.keys(item.episodes).map(parseEpisodeKey).filter((ref) => ref.season > 0 && isAired(series, ref)).length;
    return {watched, aired, percent: aired ? Math.round((watched / aired) * 100) : 0};
};

/** The first aired episode not yet watched, in season order. */
export const nextEpisode = (item: LibraryItem): EpisodeRef | null => {
    const series = item.series;
    if (!series) return null;
    for (const season of series.seasons) {
        for (let episode = 1; episode <= season.episodeCount; episode++) {
            const ref = {season: season.number, episode};
            if (!isAired(series, ref)) return null;
            if (!item.episodes[episodeKey(ref)]) return ref;
        }
    }
    return null;
};

/** Followed series with something left to watch, most recently touched first. */
export const upNextItems = (library: Library): {item: LibraryItem; next: EpisodeRef}[] =>
    Object.values(library.items)
        .filter((item) => item.mediaType === MEDIA_TYPE.TV && item.isFollowing)
        .map((item) => ({item, next: nextEpisode(item)}))
        .filter((entry): entry is {item: LibraryItem; next: EpisodeRef} => entry.next !== null)
        .sort((a, b) => b.item.updatedAt.localeCompare(a.item.updatedAt));

/** Lets stored titles reuse the TMDB poster grid. */
export const toMediaSummary = (item: LibraryItem): MediaSummary => ({
    id: item.id,
    media_type: item.mediaType,
    title: item.title,
    overview: "",
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath,
    release_date: item.year,
    vote_average: 0,
    genre_ids: [],
});

/** Every title with a written review, most recently written first. */
export const reviewedItems = (library: Library): LibraryItem[] =>
    Object.values(library.items)
        .filter((item) => Boolean(item.review))
        .sort((a, b) => (b.review?.updatedAt ?? "").localeCompare(a.review?.updatedAt ?? ""));

export const favoriteItems =(library: Library): LibraryItem[] =>
    Object.values(library.items)
        .filter((item) => item.isFavorite)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const watchlistItems = (library: Library): LibraryItem[] =>
    Object.values(library.items)
        .filter((item) => item.isInWatchlist)
        .sort((a, b) => b.addedAt.localeCompare(a.addedAt));

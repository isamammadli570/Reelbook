import type {GenreTile} from "@/constants/genres";
import {MEDIA_FILTER, MEDIA_TYPE, type MediaFilter, type MediaType} from "@/constants/other";

/** The TMDB genre id for a tile and kind of title; `null` when series have no such genre. */
export const genreIdFor = (genre: GenreTile, mediaType: MediaType): number | null => (mediaType === MEDIA_TYPE.MOVIE ? genre.movieId : genre.tvId);

/** How a tile asks TMDB for one kind of title: by genre, by keyword where series lack the genre, or not at all. */
export const genreParamsFor = (genre: GenreTile, mediaType: MediaType): Record<string, number> | null => {
    const id = genreIdFor(genre, mediaType);
    if (id !== null) return {with_genres: id};
    if (mediaType === MEDIA_TYPE.TV && genre.tvKeywordId) return {with_keywords: genre.tvKeywordId};
    return null;
};

/** The tiles a filter can use: with "Series" chosen, genres series cannot be asked for are left out. */
export const genresFor = (genres: GenreTile[], filter: MediaFilter): GenreTile[] =>
    filter === MEDIA_FILTER.TV ? genres.filter((genre) => genreParamsFor(genre, MEDIA_TYPE.TV) !== null) : genres;

/** The kinds of title a tile fetches for a filter: "All" asks both, unless series cannot be asked for it. */
export const mediaTypesFor = (genre: GenreTile, filter: MediaFilter): MediaType[] => {
    const all = filter === MEDIA_FILTER.ALL ? [MEDIA_TYPE.MOVIE, MEDIA_TYPE.TV] : [filter];
    return all.filter((mediaType) => genreParamsFor(genre, mediaType) !== null);
};

export const DISCOVER_SORT = {POPULARITY: "popularity", RATING: "rating", NEWEST: "newest"} as const;
export type DiscoverSort = (typeof DISCOVER_SORT)[keyof typeof DISCOVER_SORT];

/**
 * What narrows Discover besides the genre. Services and languages may hold several (either one matches);
 * decades are kept as one unbroken run, since TMDB filters by a single date range. A decade is its first year,
 * and 0 stands for everything before 1990.
 */
export type DiscoverFilters = {
    providerIds: number[];
    languages: string[];
    decades: number[];
    minRating: number | null;
    sort: DiscoverSort;
};

export const EMPTY_FILTERS: DiscoverFilters = {providerIds: [], languages: [], decades: [], minRating: null, sort: DISCOVER_SORT.POPULARITY};

/** Original languages offered as filters, each a cinema people look for by name. */
export const DISCOVER_LANGUAGES = ["tr", "ko", "ja", "hi", "es", "fr", "en", "ru"] as const;
/** Newest first, as the sheet lists them; 0 is "before 1990". */
export const DISCOVER_DECADES = [2020, 2010, 2000, 1990, 0] as const;
export const DISCOVER_RATINGS = [6, 7, 8] as const;

/** Adds a value to a list, or takes it out if it is already there. */
export const toggleValue = <T>(values: T[], value: T): T[] => (values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);

/**
 * Picks decades as one unbroken run, as TMDB needs: choosing 2000 with 2020 also takes in 2010 between them.
 * Tapping an end of the run lets it go; tapping one inside narrows the run to that decade alone.
 */
export const toggleDecade = (selected: number[], decade: number): number[] => {
    const order: number[] = [...DISCOVER_DECADES];
    const positions = selected.map((value) => order.indexOf(value)).sort((a, b) => a - b);
    const at = order.indexOf(decade);
    if (!positions.length) return [decade];
    const first = positions[0];
    const last = positions[positions.length - 1];
    if (!selected.includes(decade)) return order.slice(Math.min(first, at), Math.max(last, at) + 1);
    if (at === first) return order.slice(first + 1, last + 1);
    if (at === last) return order.slice(first, last);
    return [decade];
};

/** The years a run of decades covers: `from` is `null` when it reaches back before 1990. */
export const decadeSpan = (decades: number[]): {from: number | null; to: number} | null => {
    if (!decades.length) return null;
    const lowest = Math.min(...decades);
    const highest = Math.max(...decades);
    return {from: lowest === 0 ? null : lowest, to: highest === 0 ? 1989 : highest + 9};
};

/** How many kinds of filter differ from the defaults, for the badge on the filter button. */
export const activeFilterCount = (filters: DiscoverFilters): number =>
    [filters.providerIds.length > 0, filters.languages.length > 0, filters.decades.length > 0, filters.minRating !== null, filters.sort !== DISCOVER_SORT.POPULARITY]
        .filter(Boolean).length;

/** Enough votes that a rating means something; sorting by rating needs more, or obscure titles with one 10 lead. */
const MIN_VOTES = 50;
const MIN_VOTES_FOR_RATING_SORT = 300;

type DiscoverQuery = {genre: GenreTile | null; filters: DiscoverFilters; region: string; today: string};

/** The TMDB discover parameters for one kind of title; `null` when the genre cannot be asked for it. */
export const discoverParams = (mediaType: MediaType, {genre, filters, region, today}: DiscoverQuery): Record<string, string | number> | null => {
    const byGenre = genre ? genreParamsFor(genre, mediaType) : {};
    if (!byGenre) return null;

    const dateField = mediaType === MEDIA_TYPE.MOVIE ? "primary_release_date" : "first_air_date";
    const params: Record<string, string | number> = {
        ...byGenre,
        sort_by: {popularity: "popularity.desc", rating: "vote_average.desc", newest: `${dateField}.desc`}[filters.sort],
        "vote_count.gte": filters.sort === DISCOVER_SORT.RATING ? MIN_VOTES_FOR_RATING_SORT : MIN_VOTES,
    };

    // Newest means out already, not announced for next year.
    let latest = filters.sort === DISCOVER_SORT.NEWEST ? today : null;
    const span = decadeSpan(filters.decades);
    if (span) {
        const end = `${span.to}-12-31`;
        if (span.from !== null) params[`${dateField}.gte`] = `${span.from}-01-01`;
        latest = latest && latest < end ? latest : end;
    }
    if (latest) params[`${dateField}.lte`] = latest;

    if (filters.minRating !== null) params["vote_average.gte"] = filters.minRating;
    // TMDB reads "|" as "either": Turkish or Japanese, on Netflix or on Disney+.
    if (filters.languages.length) params.with_original_language = filters.languages.join("|");
    if (filters.providerIds.length) {
        // Included in a subscription or free, which is what "on Netflix" means, not rent or buy.
        params.with_watch_providers = filters.providerIds.join("|");
        params.watch_region = region;
        params.with_watch_monetization_types = "flatrate|free|ads";
    }
    return params;
};
